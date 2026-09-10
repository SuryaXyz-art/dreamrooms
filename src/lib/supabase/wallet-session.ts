import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { verifyMessage } from "viem";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { walletAddressSchema } from "@/lib/supabase/schema";

const SESSION_COOKIE = "dreamrooms_session";
const SESSION_TTL_SECONDS = 3600;

function sessionSecret(): string {
  const secret = process.env.DREAMROOMS_SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("DreamRooms session configuration is missing.");
  return secret;
}

export function authMessage(
  address: string,
  nonce: string,
  action: string,
  issuedAt: string,
  expiresAt: string,
): string {
  const domain = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `DreamRooms wants you to sign in.\n\nDomain: ${domain}\nWallet: ${address.toLowerCase()}\nChain: 50312 (Somnia Shannon)\nAction: ${action}\nNonce: ${nonce}\nIssued: ${issuedAt}\nExpires: ${expiresAt}`;
}

export async function issueNonce(
  address: string,
  action: string,
): Promise<{ nonce: string; message: string; expiresAt: string }> {
  const parsed = walletAddressSchema.parse(address).toLowerCase();
  const nonce = randomBytes(32).toString("hex");
  const issued = new Date();
  const expires = new Date(issued.getTime() + 10 * 60 * 1000);
  const message = authMessage(parsed, nonce, action, issued.toISOString(), expires.toISOString());
  const { error } = await createSupabaseServerClient()
    .from("wallet_nonces")
    .insert({
      wallet_address: parsed,
      nonce_hash: createHash("sha256").update(nonce).digest("hex"),
      message,
      action,
      expires_at: expires.toISOString(),
    });
  if (error) throw new Error("Could not create an authentication nonce.");
  return { nonce, message, expiresAt: expires.toISOString() };
}

export async function verifyNonceAndCreateSession(input: {
  address: string;
  nonce: string;
  signature: `0x${string}`;
  action: string;
  message: string;
}): Promise<void> {
  const address = walletAddressSchema.parse(input.address).toLowerCase();
  const hash = createHash("sha256").update(input.nonce).digest("hex");
  const supabase = createSupabaseServerClient();
  const { data: nonceRow, error: nonceError } = await supabase
    .from("wallet_nonces")
    .select("id, message, action, expires_at, consumed_at")
    .eq("wallet_address", address)
    .eq("nonce_hash", hash)
    .maybeSingle();
  if (
    nonceError ||
    !nonceRow ||
    nonceRow.consumed_at ||
    new Date(nonceRow.expires_at).getTime() <= Date.now()
  )
    throw new Error("Authentication nonce is invalid or expired.");
  if (nonceRow.message !== input.message || nonceRow.action !== input.action)
    throw new Error("Authentication message does not match the nonce.");
  if (
    !(await verifyMessage({
      address: address as `0x${string}`,
      message: input.message,
      signature: input.signature,
    }))
  )
    throw new Error("Wallet signature is invalid.");
  const { error } = await supabase
    .from("wallet_nonces")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", nonceRow.id)
    .is("consumed_at", null);
  if (error) throw new Error("Authentication nonce could not be consumed.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ address, expires }), "utf8").toString("base64url");
  const mac = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${mac}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export async function getAuthenticatedWallet(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected)))
    return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      address?: string;
      expires?: number;
    };
    if (!parsed.address || !parsed.expires || parsed.expires <= Math.floor(Date.now() / 1000))
      return null;
    return walletAddressSchema.parse(parsed.address).toLowerCase();
  } catch {
    return null;
  }
}
