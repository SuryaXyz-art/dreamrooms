import { NextResponse } from "next/server";
import { errorResponse, readJSON, requireWallet } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reactionSchema, roomSlugSchema } from "@/lib/supabase/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const wallet = await requireWallet();
  if (wallet instanceof NextResponse) return wallet;
  try {
    const slug = roomSlugSchema.parse((await params).slug);
    const { reaction } = reactionSchema.parse(await readJSON(request));
    const supabase = createSupabaseServerClient();
    const { data: room } = await supabase
      .from("rooms")
      .select("id, market_expires_at")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    if (!room || new Date(room.market_expires_at).getTime() <= Date.now())
      return errorResponse("Reactions are closed for this room.", 409);
    const { count } = await supabase
      .from("room_reactions")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("wallet_address", wallet)
      .gte("created_at", new Date(Date.now() - 60_000).toISOString());
    if ((count ?? 0) >= 5) return errorResponse("Reaction rate limit reached.", 429);
    const { error } = await supabase
      .from("room_reactions")
      .insert({ room_id: room.id, wallet_address: wallet, reaction });
    if (error) return errorResponse("Could not add reaction.", 503);
    return NextResponse.json({ reaction }, { status: 201 });
  } catch {
    return errorResponse("Reaction request is invalid.", 400);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const wallet = await requireWallet();
  if (wallet instanceof NextResponse) return wallet;
  try {
    const slug = roomSlugSchema.parse((await params).slug);
    const { reaction } = reactionSchema.parse(await readJSON(request));
    const supabase = createSupabaseServerClient();
    const { data: room } = await supabase
      .from("rooms")
      .select("id, market_expires_at")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    if (!room || new Date(room.market_expires_at).getTime() <= Date.now())
      return errorResponse("Reactions are closed for this room.", 409);
    const { data: latest } = await supabase
      .from("room_reactions")
      .select("id")
      .eq("room_id", room.id)
      .eq("wallet_address", wallet)
      .eq("reaction", reaction)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest) return NextResponse.json({ removed: false });
    const { error } = await supabase.from("room_reactions").delete().eq("id", latest.id);
    if (error) return errorResponse("Could not remove reaction.", 503);
    return NextResponse.json({ removed: true });
  } catch {
    return errorResponse("Reaction request is invalid.", 400);
  }
}
