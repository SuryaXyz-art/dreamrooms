import { describe, expect, it } from "vitest";
import { normalizeMarket } from "@/lib/domain/adapters";
import { canTradeMarket, getMarketWindowState } from "@/lib/dreamdex/market-gates";

const startMs = Date.parse("2026-09-07T12:00:00.000Z");
const expiryMs = Date.parse("2026-09-07T12:15:00.000Z");

function market(status: string = "Trading", onchainStatus?: number) {
  return normalizeMarket(
    {
      id: "0xmarket",
      asset: "BTC",
      status,
      ...(onchainStatus === undefined ? {} : { onchainStatus }),
      tradingStart: String(startMs / 1_000),
      expiry: String(expiryMs / 1_000),
    },
    "LIVE",
  );
}

describe("market gates", () => {
  it("handles exact open and expiry boundaries", () => {
    expect(getMarketWindowState(market(), startMs - 1)).toBe("NOT_OPEN");
    expect(getMarketWindowState(market(), startMs)).toBe("TRADING");
    expect(getMarketWindowState(market(), expiryMs - 1)).toBe("TRADING");
    expect(getMarketWindowState(market(), expiryMs)).toBe("CLOSED");
  });

  it("requires on-chain Trading and fresh live data", () => {
    expect(canTradeMarket(market("Indexed status is stale", 1), startMs + 1)).toBe(true);
    expect(canTradeMarket(market("Indexed status says Trading", 2), startMs + 1)).toBe(false);

    const staleMarket = { ...market(), source: "STALE" as const, freshness: "STALE" as const };
    expect(canTradeMarket(staleMarket, startMs + 1)).toBe(false);
  });
});
