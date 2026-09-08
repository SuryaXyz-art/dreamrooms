import type { Asset, Market, MarketStatus, OrderBook, OrderBookLevel } from "@/lib/domain/models";

export interface RawMarketRecord {
  id: string;
  asset: string;
  question?: string;
  strike?: string | null;
  intervalSec?: number | string | null;
  tradingStart?: string;
  expiry?: string;
  status?: string;
  venueId?: string | null;
  operatorId?: number | null;
  poolAddress?: string | null;
  marketAddress?: string | null;
  outcomeTokenAddress?: string | null;
  collateralAddress?: string | null;
  poolNonce?: string | null;
  upSymbol?: string | null;
  downSymbol?: string | null;
  resolutionMode?: "reference" | "fixed" | null;
  yesTokenId?: string | null;
  noTokenId?: string | null;
  quoteDecimals?: number | null;
  onchainStatus?: number | null;
}

const assets: readonly Asset[] = ["BTC", "ETH"];
const statuses: readonly MarketStatus[] = [
  "LISTED",
  "TRADING",
  "LOCKED",
  "SETTLING",
  "RESOLVED",
  "VOIDED",
  "FINALIZED",
  "UNKNOWN",
];

function normalizeAsset(asset: string): Asset {
  const normalized = asset.toUpperCase();
  return assets.includes(normalized as Asset) ? (normalized as Asset) : "BTC";
}

export function normalizeOnchainStatus(status: number | null | undefined): MarketStatus {
  switch (status) {
    case 0:
      return "LISTED";
    case 1:
      return "TRADING";
    case 2:
      return "LOCKED";
    case 3:
      return "SETTLING";
    case 4:
      return "RESOLVED";
    case 5:
      return "VOIDED";
    default:
      return "UNKNOWN";
  }
}

function normalizeStatus(status: string | number | undefined): MarketStatus {
  if (typeof status === "number") return normalizeOnchainStatus(status);
  const normalized = status?.toUpperCase() ?? "UNKNOWN";
  return statuses.includes(normalized as MarketStatus) ? (normalized as MarketStatus) : "UNKNOWN";
}

export function normalizeMarket(record: RawMarketRecord, source: Market["source"]): Market {
  const intervalSeconds =
    typeof record.intervalSec === "string" ? Number(record.intervalSec) : (record.intervalSec ?? 0);
  const status =
    record.onchainStatus !== undefined
      ? normalizeOnchainStatus(record.onchainStatus)
      : normalizeStatus(record.status);
  return {
    id: record.id,
    asset: normalizeAsset(record.asset),
    question: record.question ?? "Event Contract market",
    strike: record.strike ?? "Unavailable",
    resolutionMode: record.resolutionMode === "fixed" ? "FIXED" : "REFERENCE",
    intervalSeconds: Number.isFinite(intervalSeconds) ? intervalSeconds : 0,
    tradingStart: record.tradingStart ?? "",
    expiry: record.expiry ?? "",
    status,
    yesTokenId: record.yesTokenId ?? null,
    noTokenId: record.noTokenId ?? null,
    quoteDecimals: record.quoteDecimals ?? null,
    venueId: record.venueId ?? null,
    operatorId: record.operatorId ?? null,
    poolAddress: record.poolAddress ?? null,
    marketAddress: record.marketAddress ?? null,
    outcomeTokenAddress: record.outcomeTokenAddress ?? null,
    collateralAddress: record.collateralAddress ?? null,
    poolNonce: record.poolNonce ?? null,
    upSymbol: record.upSymbol ?? null,
    downSymbol: record.downSymbol ?? null,
    source,
    freshness: source === "LIVE" ? "FRESH" : source === "STALE" ? "STALE" : "UNKNOWN",
    lastUpdatedAt: new Date().toISOString(),
  };
}

export interface RawBookRecord {
  marketId: string;
  upBids?: OrderBookLevel[];
  upAsks?: OrderBookLevel[];
  downBids?: OrderBookLevel[];
  downAsks?: OrderBookLevel[];
}

function levels(input: OrderBookLevel[] | undefined): OrderBookLevel[] {
  return (input ?? []).map((level) => ({
    price: Number.isFinite(level.price) ? level.price : 0,
    quantity: Number.isFinite(level.quantity) ? level.quantity : 0,
  }));
}

export function normalizeOrderBook(record: RawBookRecord, source: OrderBook["source"]): OrderBook {
  const upBids = levels(record.upBids);
  const upAsks = levels(record.upAsks);
  const downBids = levels(record.downBids);
  const downAsks = levels(record.downAsks);
  const quantity = (items: OrderBookLevel[]) =>
    items.reduce((total, level) => total + level.quantity, 0);
  return {
    marketId: record.marketId,
    upBids,
    upAsks,
    downBids,
    downAsks,
    bestUpBid: upBids[0]?.price ?? null,
    bestUpAsk: upAsks[0]?.price ?? null,
    bestDownBid: downBids[0]?.price ?? null,
    bestDownAsk: downAsks[0]?.price ?? null,
    availableUpBidQuantity: quantity(upBids),
    availableUpAskQuantity: quantity(upAsks),
    availableDownBidQuantity: quantity(downBids),
    availableDownAskQuantity: quantity(downAsks),
    source,
    freshness: source === "LIVE" ? "FRESH" : source === "STALE" ? "STALE" : "UNKNOWN",
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function emptyOrderBook(marketId: string, source: OrderBook["source"]): OrderBook {
  return normalizeOrderBook({ marketId }, source);
}
