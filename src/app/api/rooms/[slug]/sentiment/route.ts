import { NextResponse } from "next/server";
import { errorResponse, readJSON, requireWallet } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roomSlugSchema, sentimentSchema } from "@/lib/supabase/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const wallet = await requireWallet(request);
  if (wallet instanceof NextResponse) return wallet;
  try {
    const slug = roomSlugSchema.parse((await params).slug);
    const { side } = sentimentSchema.parse(await readJSON(request));
    const supabase = createSupabaseServerClient();
    const { data: room } = await supabase
      .from("rooms")
      .select("id, market_expires_at")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    if (!room || new Date(room.market_expires_at).getTime() <= Date.now())
      return errorResponse("Sentiment is closed for this room.", 409);
    const { error } = await supabase
      .from("room_sentiments")
      .upsert(
        { room_id: room.id, wallet_address: wallet, side },
        { onConflict: "room_id,wallet_address" },
      );
    if (error) return errorResponse("Could not update sentiment.", 503);
    return NextResponse.json({ side });
  } catch {
    return errorResponse("Sentiment request is invalid.", 400);
  }
}
