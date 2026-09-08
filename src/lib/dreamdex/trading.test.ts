import { describe, expect, it } from "vitest";
import type { BinaryOrderBook, MarketOnchain } from "@somnia-chain/markets-sdk";
import {
  canTransitionTradeState,
  claimsForFinalizedMarkets,
  evaluateTradePreflight,
  quoteTrade,
  receiptSucceeded,
  type TradeSnapshot,
} from "@/lib/dreamdex/trading";

const address = "0x1111111111111111111111111111111111111111" as const;
const marketId = `0x${"ab".repeat(32)}` as `0x${string}`;

const onchain: MarketOnchain = {
  marketAddress: address,
  outcomeToken: address,
  yesId: 11n,
  noId: 12n,
  pool: address,
  nonce: 1n,
  collateral: address,
  status: 1,
  backing: 1_000_000n,
  finalized: false,
  expiry: BigInt(Math.floor(Date.now() / 1000) + 3_600),
  decimals: 6,
  winningOutcome: 0,
  isResolved: false,
  isVoided: false,
  voidPolicy: null,
};

const book: BinaryOrderBook = {
  yesBids: [{ price: 400_000n, quantity: 2_000_000n }],
  yesAsks: [{ price: 600_000n, quantity: 2_000_000n }],
  noBids: [{ price: 400_000n, quantity: 2_000_000n }],
  noAsks: [{ price: 600_000n, quantity: 2_000_000n }],
};

const snapshot: TradeSnapshot = {
  onchain,
  book,
  bookParams: { tickSize: 10_000n, minQuantity: 100_000n, lotSize: 100_000n },
  metadata: { symbol: "tUSDC", name: "Test USDC", decimals: 6 },
  collateralBalance: 10_000_000n,
  allowance: 10_000_000n,
  upPositionBalance: 0n,
  downPositionBalance: 0n,
};

describe("wallet trading kernel", () => {
  it("quotes a lot-aligned buy with a tick-aligned protective limit", () => {
    const quote = quoteTrade(marketId, "UP", "1", snapshot);
    expect(quote.quantityRaw % snapshot.bookParams.lotSize).toBe(0n);
    expect(quote.yesPriceRaw % snapshot.bookParams.tickSize).toBe(0n);
    expect(quote.quantityRaw).toBeGreaterThanOrEqual(snapshot.bookParams.minQuantity);
    expect(quote.maxSpendRaw).toBeLessThanOrEqual(1_000_000n);
    expect(quote.expectedExecutionPriceRaw).toBeGreaterThan(0n);
    expect(quote.testnet).toBe(true);
  });

  it("models the wallet and receipt lifecycle without treating a revert as success", () => {
    expect(canTransitionTradeState("review", "awaiting_signature")).toBe(true);
    expect(canTransitionTradeState("submitted", "confirmed")).toBe(true);
    expect(canTransitionTradeState("confirmed", "submitted")).toBe(false);
    expect(receiptSucceeded({ status: "success" })).toBe(true);
    expect(receiptSucceeded({ status: "reverted" })).toBe(false);
  });

  it("keeps only claimable rows whose market was found by finalized discovery", () => {
    const claimable = [
      {
        marketId,
        pool: address,
        outcomeIdx: 0 as const,
        amount: 1_000_000n,
        estPayout: 990_000n,
        status: "Resolved",
      },
      {
        marketId: `0x${"cd".repeat(32)}`,
        pool: address,
        outcomeIdx: 1 as const,
        amount: 2_000_000n,
        estPayout: 2_000_000n,
        status: "Resolved",
      },
    ];
    const claims = claimsForFinalizedMarkets(claimable, [{ marketId, quoteDecimals: 6 }]);
    expect(claims).toHaveLength(1);
    expect(claims[0]?.marketId).toBe(marketId);
    expect(claims[0]?.decimals).toBe(6);
  });

  it("blocks preflight when the network, freshness, or low-value cap is unsafe", () => {
    const market = {
      id: marketId,
      asset: "BTC" as const,
      question: "BTC test",
      strike: "0",
      resolutionMode: "REFERENCE" as const,
      intervalSeconds: 3600,
      tradingStart: String(Math.floor(Date.now() / 1000) - 60),
      expiry: String(Math.floor(Date.now() / 1000) + 3600),
      status: "TRADING" as const,
      yesTokenId: null,
      noTokenId: null,
      quoteDecimals: 6,
      venueId: "venue",
      operatorId: null,
      poolAddress: address,
      marketAddress: address,
      outcomeTokenAddress: address,
      collateralAddress: address,
      poolNonce: "1",
      upSymbol: "UP",
      downSymbol: "DOWN",
      source: "LIVE" as const,
      freshness: "FRESH" as const,
      lastUpdatedAt: new Date().toISOString(),
    };
    const quote = quoteTrade(marketId, "UP", "1", snapshot);
    const checks = evaluateTradePreflight({
      connected: true,
      addressMatches: true,
      chainId: 1,
      nativeBalance: 0n,
      market,
      bookSource: "STALE",
      bookFreshness: "STALE",
      snapshot,
      quote: { ...quote, maxSpendRaw: 1_000_001n },
      quoteError: null,
      walletReady: true,
      duplicatePending: false,
    });
    expect(checks.find((check) => check.id === "chain")?.status).toBe("failed");
    expect(checks.find((check) => check.id === "freshness")?.status).toBe("failed");
    expect(checks.find((check) => check.id === "cap")?.status).toBe("failed");
  });
});
