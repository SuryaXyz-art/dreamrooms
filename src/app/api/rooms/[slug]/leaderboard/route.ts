import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roomSlugSchema } from "@/lib/supabase/schema";
import { verifiedLeaderboard } from "@/lib/supabase/social-state";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const slug = roomSlugSchema.parse((await params).slug);
    const supabase = createSupabaseServerClient();
    const { data: room } = await supabase.from("rooms").select("id").eq("slug", slug).single();
    if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
    const { data, error } = await supabase
      .from("verified_trades")
      .select("wallet_address, side, filled_quantity, verified_at")
      .eq("room_id", room.id)
      .eq("verification_status", "verified");
    if (error) return NextResponse.json({ error: "Leaderboard unavailable." }, { status: 503 });
    const leaderboard = verifiedLeaderboard(
      (data ?? [])
        .filter((row) => row.side === "UP" || row.side === "DOWN")
        .map((row) => ({ wallet_address: row.wallet_address, side: row.side as "UP" | "DOWN" })),
    ).map((row) => ({
      rank: row.rank,
      walletAddress: `${row.walletAddress.slice(0, 6)}…${row.walletAddress.slice(-4)}`,
      verifiedTradeCount: row.verifiedTradeCount,
    }));
    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json({ error: "Leaderboard unavailable." }, { status: 503 });
  }
}
