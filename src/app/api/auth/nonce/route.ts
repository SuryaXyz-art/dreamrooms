import { NextResponse } from "next/server";
import { walletAddressSchema } from "@/lib/supabase/schema";
import { issueNonce } from "@/lib/supabase/wallet-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { address?: unknown; action?: unknown };
    const address = walletAddressSchema.parse(body.address);
    const action =
      typeof body.action === "string" && /^[a-z_]{3,40}$/.test(body.action)
        ? body.action
        : "room_join";
    const result = await issueNonce(address, action);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not issue a wallet nonce." }, { status: 400 });
  }
}
