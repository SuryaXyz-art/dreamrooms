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
      .select("id")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    if (!room) return errorResponse("Room not found.", 404);
    const { error } = await supabase
      .from("room_participants")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("room_id", room.id)
      .eq("wallet_address", wallet);
    if (error) return errorResponse("Presence update failed.", 503);
    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("Presence update failed.", 400);
  }
}
