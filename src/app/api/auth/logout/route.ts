import { NextResponse } from "next/server";
import { clearWalletSession } from "@/lib/supabase/wallet-session";

export async function POST() {
  await clearWalletSession();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
