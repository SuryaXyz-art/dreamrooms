import { describe, expect, it } from "vitest";
import { normalizeMarket, normalizeOrderBook } from "@/lib/domain/adapters";

describe("domain adapters", () => {
  it("normalizes structured fields and prefers the chain status", () => {
    const market = normalizeMarket(
      {
        id: "market-1",
        asset: "eth",
        question: "A question with no structured hints",
        strike: "2500",
        intervalSec: 900,
        status: "Trading",
        onchainStatus: 2,
      },
      "LIVE",
    );

    expect(market.asset).toBe("ETH");
    expect(market.strike).toBe("2500");
    expect(market.intervalSeconds).toBe(900);
    expect(market.status).toBe("LOCKED");
    expect(market.source).toBe("LIVE");
  });

  it("marks malformed status and book values safely", () => {
    const market = normalizeMarket({ id: "market-2", asset: "unknown", status: "nope" }, "STALE");
    const book = normalizeOrderBook(
      { marketId: "market-2", upBids: [{ price: Number.NaN, quantity: 2 }] },
      "STALE",
    );

    expect(market.status).toBe("UNKNOWN");
    expect(market.source).toBe("STALE");
    expect(book.upBids).toEqual([{ price: 0, quantity: 2 }]);
    expect(book.lastUpdatedAt).toBeTruthy();
  });
});
