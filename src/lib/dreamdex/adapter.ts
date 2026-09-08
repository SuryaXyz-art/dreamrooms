import {
  priceToProbability,
  resolveIntervalSec,
  toHuman,
  type BinaryMarket,
  type BinaryOrderBook,
  type MarketOnchain,
} from "@somnia-chain/markets-sdk";
import { normalizeMarket, normalizeOrderBook, type RawMarketRecord } from "@/lib/domain/adapters";
import type { Market, OrderBook } from "@/lib/domain/models";
import { refreshFreshness } from "@/lib/dreamdex/freshness";

export function toDreamDexMarket(
  indexed: BinaryMarket,
  onchain: MarketOnchain | null,
  source: Market["source"],
): Market {
  const intervalSec = resolveIntervalSec(indexed);
  const record: RawMarketRecord = {
    id: indexed.marketId,
    asset: indexed.asset,
    question: indexed.question,
    strike: indexed.strike,
    ...(intervalSec !== null ? { intervalSec } : {}),
    tradingStart: indexed.tradingStart,
    expiry: indexed.expiry,
    status: indexed.status,
    onchainStatus: onchain?.status ?? null,
    venueId: indexed.venueId ?? null,
    operatorId: indexed.operatorId ?? null,
    poolAddress: onchain?.pool ?? indexed.poolAddress,
    marketAddress: onchain?.marketAddress ?? indexed.marketAddress,
    outcomeTokenAddress: onchain?.outcomeToken ?? null,
    collateralAddress: onchain?.collateral ?? null,
    poolNonce: onchain?.nonce.toString() ?? indexed.nonce ?? null,
    resolutionMode: indexed.mode,
    yesTokenId: indexed.yesTokenId,
    noTokenId: indexed.noTokenId,
    quoteDecimals: indexed.quoteDecimals,
  };
  return refreshFreshness(normalizeMarket(record, source));
}

function normalizeLevels(levels: Array<{ price: bigint; quantity: bigint }>, decimals: number) {
  return levels.map((level) => ({
    price: priceToProbability(level.price, decimals),
    quantity: toHuman(level.quantity, decimals),
  }));
}

export function toDreamDexOrderBook(
  marketId: string,
  book: BinaryOrderBook,
  decimals: number,
  source: OrderBook["source"],
): OrderBook {
  return refreshFreshness(
    normalizeOrderBook(
      {
        marketId,
        upBids: normalizeLevels(book.yesBids, decimals),
        upAsks: normalizeLevels(book.yesAsks, decimals),
        downBids: normalizeLevels(book.noBids, decimals),
        downAsks: normalizeLevels(book.noAsks, decimals),
      },
      source,
    ),
  );
}
