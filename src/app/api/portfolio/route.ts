import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { errorResponse } from "@/lib/api";
import { createDreamDexExchange } from "@/lib/dreamdex/config";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address || !isAddress(address)) return errorResponse("Invalid wallet address.", 400);
  try {
    const portfolio = await createDreamDexExchange().client.getPortfolio(address);
    return NextResponse.json(
      {
        account: portfolio.account,
        positions: portfolio.positions,
        openOrders: portfolio.openOrders,
        trades: portfolio.trades,
        tradesTruncated: portfolio.tradesTruncated,
        source: "LIVE",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return errorResponse("Portfolio data is temporarily unavailable. Retry shortly.", 503);
  }
}
