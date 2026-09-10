import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { activeParticipantCount, aggregateSentiment } from "@/lib/supabase/social-state";
import { roomSlugSchema } from "@/lib/supabase/schema";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const parsedSlug = roomSlugSchema.safeParse(rawSlug);
  if (!parsedSlug.success)
    return NextResponse.json({ error: "Room not found or expired." }, { status: 404 });
  const slug = parsedSlug.data;
  try {
    const { data, error } = await createSupabaseServerClient()
      .from("rooms")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    if (error || !data || new Date(data.market_expires_at).getTime() <= Date.now())
      return NextResponse.json({ error: "Room not found or expired." }, { status: 404 });
    const [participants, sentiments, reactions, trades] = await Promise.all([
      createSupabaseServerClient()
        .from("room_participants")
        .select("wallet_address, joined_at, last_seen_at")
        .eq("room_id", data.id),
      createSupabaseServerClient().from("room_sentiments").select("side").eq("room_id", data.id),
      createSupabaseServerClient()
        .from("room_reactions")
        .select("reaction, created_at")
        .eq("room_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50),
      createSupabaseServerClient()
        .from("verified_trades")
        .select(
          "wallet_address, market_id, side, filled_quantity, execution_price, transaction_hash, block_number, verified_at",
        )
        .eq("room_id", data.id)
        .eq("verification_status", "verified")
        .order("verified_at", { ascending: false })
        .limit(50),
    ]);
    const activeParticipants = (participants.data ?? []).filter(
      (row) => new Date(row.last_seen_at).getTime() > Date.now() - 90_000,
    );
    const sentiment = aggregateSentiment(
      (sentiments.data ?? []).filter(
        (row): row is { side: "UP" | "DOWN" } => row.side === "UP" || row.side === "DOWN",
      ),
    );
    return NextResponse.json(
      {
        room: data,
        participants: activeParticipants,
        participantCount: activeParticipantCount(participants.data ?? []),
        sentiment,
        reactions: reactions.data ?? [],
        verifiedTrades: trades.data ?? [],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Room service is unavailable." }, { status: 503 });
  }
}
