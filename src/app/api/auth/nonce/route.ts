import { NextResponse } from "next/server";
import { walletAddressSchema } from "@/lib/supabase/schema";
import { issueNonce } from "@/lib/supabase/wallet-session";

export async function POST(request: Request) {
  let body: { address?: unknown; action?: unknown };
  try {
    body = (await request.json()) as { address?: unknown; action?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid authentication request." }, { status: 400 });
  }
  const addressResult = walletAddressSchema.safeParse(body.address);
  if (!addressResult.success) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }
  const action =
    typeof body.action === "string" && /^[a-z_]{3,40}$/.test(body.action)
      ? body.action
      : "room_join";
  try {
    const result = await issueNonce(addressResult.data, action);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Wallet authentication service is unavailable. Verify Supabase configuration." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
