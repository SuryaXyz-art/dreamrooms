import { NextResponse } from "next/server";
import { clearWalletSession, getAuthenticatedWallet } from "@/lib/supabase/wallet-session";
import { walletAddressesMatch } from "@/lib/supabase/wallet-address";

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requireWallet(request: Request): Promise<string | NextResponse> {
  try {
    const wallet = await getAuthenticatedWallet();
    const claimedWallet = request.headers.get("x-dreamrooms-wallet")?.trim().toLowerCase();
    if (!wallet) return errorResponse("Authenticate the wallet before changing room state.", 401);
    if (!walletAddressesMatch(wallet, claimedWallet)) {
      await clearWalletSession();
      return errorResponse("Wallet account changed. Authenticate the connected wallet again.", 401);
    }
    return wallet;
  } catch {
    return errorResponse("Wallet authentication is not configured.", 503);
  }
}

export async function readJSON(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) throw new Error("Request is too large.");
  return request.json();
}
