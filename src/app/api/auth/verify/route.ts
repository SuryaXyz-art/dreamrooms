import { NextResponse } from "next/server";
import { signedMessageSchema } from "@/lib/supabase/schema";
import { verifyNonceAndCreateSession } from "@/lib/supabase/wallet-session";

export async function POST(request: Request) {
  try {
    const input = signedMessageSchema.parse(await request.json());
    await verifyNonceAndCreateSession({ ...input, signature: input.signature as `0x${string}` });
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ error: "Wallet authentication failed." }, { status: 401 });
  }
}
