import type { Market } from "@/lib/domain/models";

export type MarketWindowState = "NOT_OPEN" | "TRADING" | "CLOSED" | "UNKNOWN";

export function getMarketWindowState(
  market: Pick<Market, "tradingStart" | "expiry">,
  nowMs = Date.now(),
): MarketWindowState {
  const startMs = Number(market.tradingStart) * 1_000;
  const expiryMs = Number(market.expiry) * 1_000;
  if (!Number.isFinite(startMs) || !Number.isFinite(expiryMs) || expiryMs <= startMs) {
    return "UNKNOWN";
  }
  if (nowMs < startMs) return "NOT_OPEN";
  if (nowMs >= expiryMs) return "CLOSED";
  return "TRADING";
}

export function canTradeMarket(market: Market, nowMs = Date.now()): boolean {
  return (
    market.source === "LIVE" &&
    market.freshness === "FRESH" &&
    market.status === "TRADING" &&
    getMarketWindowState(market, nowMs) === "TRADING"
  );
}
