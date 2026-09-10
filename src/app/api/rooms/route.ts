import { NextResponse } from "next/server";
import { canTradeMarket } from "@/lib/dreamdex/market-gates";
import { createMarketProvider } from "@/lib/providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createRoomSchema } from "@/lib/supabase/schema";
import { errorResponse, readJSON, requireWallet } from "@/lib/api";
import { randomBytes } from "node:crypto";

export async function GET() {
  try {
    const { data, error } = await createSupabaseServerClient()
      .from("rooms")
      .select("*")
      .eq("status", "active")
      .gt("market_expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return errorResponse("Room discovery is temporarily unavailable.", 503);
    return NextResponse.json({ rooms: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return errorResponse("Room persistence is not configured.", 503);
  }
}

export async function POST(request: Request) {
  const wallet = await requireWallet();
  if (wallet instanceof NextResponse) return wallet;
  try {
    const body = createRoomSchema.parse(await readJSON(request));
    const discovery = await createMarketProvider().discoverLiveMarkets();
    const market = discovery.markets.find(
      (candidate) => candidate.id.toLowerCase() === body.marketId.toLowerCase(),
    );
    if (!market || !canTradeMarket(market))
      return errorResponse("Select a fresh live Trading market.", 409);
    const slug = randomBytes(16).toString("hex");
    const { data, error } = await createSupabaseServerClient()
      .from("rooms")
      .insert({
        slug,
        host_wallet: wallet,
        market_id: market.id.toLowerCase(),
        asset: market.asset,
        title: body.title,
        thesis: body.thesis,
        language: body.language,
        suggested_max_spend: body.suggestedMaxSpend ?? null,
        market_expires_at: new Date(Number(market.expiry) * 1000).toISOString(),
      })
      .select("slug, title, market_id, market_expires_at")
      .single();
    if (error || !data) return errorResponse("Room could not be created.", 503);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.json(
      { room: data, shareUrl: `${appUrl}/rooms/${data.slug}` },
      { status: 201 },
    );
  } catch {
    return errorResponse("Room details are invalid or persistence is unavailable.", 400);
  }
}
