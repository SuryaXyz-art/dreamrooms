import { NextResponse } from "next/server";
import { errorResponse, requireWallet } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roomSlugSchema } from "@/lib/supabase/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const wallet = await requireWallet(request);
  if (wallet instanceof NextResponse) return wallet;
  try {
    const slug = roomSlugSchema.parse((await params).slug);
    const supabase = createSupabaseServerClient();
    const { data: room } = await supabase
      .from("rooms")
      .select("id, market_expires_at, status")
      .eq("slug", slug)
      .single();
    if (
      !room ||
      room.status !== "active" ||
      new Date(room.market_expires_at).getTime() <= Date.now()
    )
      return errorResponse("This room is closed or expired.", 409);
    const { error } = await supabase
      .from("room_participants")
      .upsert(
        { room_id: room.id, wallet_address: wallet, last_seen_at: new Date().toISOString() },
        { onConflict: "room_id,wallet_address" },
      );
    if (error) return errorResponse("Could not join this room.", 503);
    return NextResponse.json({ joined: true });
  } catch {
    return errorResponse("Room join failed.", 400);
  }
}
