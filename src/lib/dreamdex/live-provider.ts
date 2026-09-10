import {
  type BinaryMarket,
  type BinaryOrderBook,
  type MarketOnchain,
  type SomniaMarkets,
} from "@somnia-chain/markets-sdk";
import { emptyOrderBook } from "@/lib/domain/adapters";
import {
  type Asset,
  type DataSource,
  type Market,
  type OrderBook,
  type StatusCheck,
} from "@/lib/domain/models";
import { toDreamDexMarket, toDreamDexOrderBook } from "@/lib/dreamdex/adapter";
import {
  createDreamDexExchange,
  createShannonPublicClient,
  getDreamDexRuntimeConfig,
} from "@/lib/dreamdex/config";
import { getMarketWindowState } from "@/lib/dreamdex/market-gates";
import { withRetry } from "@/lib/dreamdex/reliability";
import type {
  MarketDiscovery,
  MarketProvider,
  MarketProviderHealth,
} from "@/lib/providers/market-provider";

const LIVE_MARKET_PAGE_SIZE = 50;
const READ_TIMEOUT_MS = 8_000;
const READ_ATTEMPTS = 3;
const BOOK_DEPTH = 10;

const readOptions = (operation: string) => ({
  attempts: READ_ATTEMPTS,
  timeoutMs: READ_TIMEOUT_MS,
  operation,
});

function nowIso(): string {
  return new Date().toISOString();
}

function unavailableOrderBook(marketId: string, source: OrderBook["source"]): OrderBook {
  return emptyOrderBook(marketId, source);
}

function errorDetail(fallback: string): string {
  return fallback;
}

interface VerifiedMarketRead {
  market: Market;
  orderBook: OrderBook;
}

async function listAllLiveMarkets(exchange: SomniaMarkets, asset: Asset): Promise<BinaryMarket[]> {
  const config = getDreamDexRuntimeConfig();
  const markets: BinaryMarket[] = [];
  let offset = 0;

  while (true) {
    const page = await withRetry(
      () =>
        exchange.client.listLiveBinaryMarkets({
          asset,
          limit: LIVE_MARKET_PAGE_SIZE,
          offset,
          ...(config.venueId ? { venueId: config.venueId } : {}),
          ...(config.operatorId !== undefined ? { operatorId: config.operatorId } : {}),
        }),
      readOptions(`live ${asset} market discovery`),
    );
    markets.push(...page);
    if (page.length < LIVE_MARKET_PAGE_SIZE) break;
    offset += page.length;
  }

  return markets;
}

async function readMarket(
  exchange: SomniaMarkets,
  indexed: BinaryMarket,
): Promise<VerifiedMarketRead> {
  let onchain: MarketOnchain | null = null;
  let market: Market;
  try {
    onchain = await withRetry(
      () => exchange.client.getMarketOnchain(indexed.marketId),
      readOptions("on-chain market status"),
    );
    market = toDreamDexMarket(indexed, onchain, "LIVE");
  } catch {
    market = toDreamDexMarket(indexed, null, "STALE");
    return { market, orderBook: unavailableOrderBook(market.id, "STALE") };
  }

  try {
    const book: BinaryOrderBook = await withRetry(
      () =>
        exchange.client.getBinaryOrderBook(onchain.pool, {
          depth: BOOK_DEPTH,
          decimals: onchain.decimals,
        }),
      readOptions("on-chain order book"),
    );
    return {
      market,
      orderBook: toDreamDexOrderBook(market.id, book, onchain.decimals, "LIVE"),
    };
  } catch {
    return { market, orderBook: unavailableOrderBook(market.id, "STALE") };
  }
}

function discoverySource(reads: VerifiedMarketRead[]): DataSource {
  if (!reads.length) return "LIVE";
  if (
    reads.every(({ market, orderBook }) => market.source === "LIVE" && orderBook.source === "LIVE")
  ) {
    return "LIVE";
  }
  return "STALE";
}

class LiveMarketProvider implements MarketProvider {
  async discoverLiveMarkets(asset?: Asset): Promise<MarketDiscovery> {
    const assets: Asset[] = asset ? [asset] : ["BTC", "ETH"];
    try {
      const exchange = createDreamDexExchange();
      const indexedMarkets = (
        await Promise.all(
          assets.map((requestedAsset) => listAllLiveMarkets(exchange, requestedAsset)),
        )
      ).flat();
      const uniqueMarkets = [
        ...new Map(indexedMarkets.map((market) => [market.marketId, market])).values(),
      ];
      const reads = await Promise.all(uniqueMarkets.map((market) => readMarket(exchange, market)));
      const activeReads = reads.filter(({ market }) => getMarketWindowState(market) === "TRADING");
      const orderBooks = Object.fromEntries(
        activeReads.map(({ market, orderBook }) => [market.id, orderBook]),
      );
      const source = discoverySource(activeReads);
      return {
        markets: activeReads.map(({ market }) => market),
        orderBooks,
        source,
        message:
          source === "LIVE"
            ? reads.length
              ? "Live market and on-chain order-book reads verified on Somnia Shannon."
              : "Live DreamDEX discovery returned no active BTC/ETH markets."
            : activeReads.length
              ? "Some indexed markets could not be verified from chain head; trading remains disabled for them."
              : "No active BTC/ETH markets are inside a currently open trading window.",
        lastUpdatedAt: nowIso(),
      };
    } catch {
      return {
        markets: [],
        orderBooks: {},
        source: "UNAVAILABLE",
        message: errorDetail(
          "Live DreamDEX discovery is temporarily unavailable. Try again shortly.",
        ),
        lastUpdatedAt: null,
      };
    }
  }

  async getOrderBook(marketId: string): Promise<OrderBook> {
    try {
      const exchange = createDreamDexExchange();
      const indexed = await withRetry(
        () => exchange.client.getBinaryMarket(marketId),
        readOptions("market lookup"),
      );
      if (!indexed) return unavailableOrderBook(marketId, "UNAVAILABLE");
      const read = await readMarket(exchange, indexed);
      return read.orderBook;
    } catch {
      return unavailableOrderBook(marketId, "UNAVAILABLE");
    }
  }

  async getHealth(): Promise<MarketProviderHealth> {
    const checkedAt = nowIso();
    try {
      const config = getDreamDexRuntimeConfig();
      const exchange = createDreamDexExchange();
      const publicClient = createShannonPublicClient();
      const checks: StatusCheck[] = [];

      let rpcReady = false;
      try {
        const chainId = await withRetry(
          () => publicClient.getChainId(),
          readOptions("Somnia Shannon RPC health"),
        );
        rpcReady = chainId === config.chainId;
        checks.push({
          name: "Somnia Shannon RPC",
          detail: rpcReady
            ? `Chain ID ${chainId} verified.`
            : "The configured RPC returned a non-Shannon chain ID.",
          state: rpcReady ? "READY" : "UNAVAILABLE",
          source: rpcReady ? "LIVE" : "UNAVAILABLE",
          lastUpdatedAt: checkedAt,
        });
      } catch {
        checks.push({
          name: "Somnia Shannon RPC",
          detail: "The configured Shannon RPC could not be reached.",
          state: "UNAVAILABLE",
          source: "UNAVAILABLE",
          lastUpdatedAt: null,
        });
      }

      let indexerReady = false;
      try {
        const assets = await withRetry(
          () => exchange.client.listBinaryAssets(),
          readOptions("DreamDEX indexer health"),
        );
        indexerReady = true;
        checks.push({
          name: "DreamDEX SDK / indexer",
          detail: `SDK ${"0.29.0"} read succeeded; ${assets.length} binary asset labels reported.`,
          state: "READY",
          source: "LIVE",
          lastUpdatedAt: checkedAt,
        });
      } catch {
        checks.push({
          name: "DreamDEX SDK / indexer",
          detail: "The official SDK could not read the configured Event Contract indexer.",
          state: "UNAVAILABLE",
          source: "UNAVAILABLE",
          lastUpdatedAt: null,
        });
      }

      try {
        const venues = await withRetry(
          () => exchange.client.listBinaryVenueIds(),
          readOptions("DreamDEX venue discovery"),
        );
        checks.push({
          name: "Venue discovery",
          detail: `${venues.length} operator/venue pair${venues.length === 1 ? "" : "s"} discovered dynamically.`,
          state: "READY",
          source: "LIVE",
          lastUpdatedAt: checkedAt,
        });
      } catch {
        checks.push({
          name: "Venue discovery",
          detail: "Dynamic operator/venue discovery is unavailable.",
          state: "UNAVAILABLE",
          source: "UNAVAILABLE",
          lastUpdatedAt: null,
        });
      }

      let liveRows: BinaryMarket[] = [];
      if (indexerReady) {
        try {
          liveRows = (
            await Promise.all(
              (["BTC", "ETH"] as const).map((asset) =>
                withRetry(
                  () => listAllLiveMarkets(exchange, asset),
                  readOptions(`live ${asset} health`),
                ),
              ),
            )
          ).flat();
        } catch {
          liveRows = [];
        }
      }

      let liveReady = false;
      if (liveRows.length && rpcReady) {
        try {
          for (const candidate of liveRows) {
            const onchain = await withRetry(
              () => exchange.client.getMarketOnchain(candidate.marketId),
              readOptions("live market status health"),
            );
            const normalized = toDreamDexMarket(candidate, onchain, "LIVE");
            if (
              onchain.status >= 0 &&
              onchain.status <= 5 &&
              getMarketWindowState(normalized) === "TRADING"
            ) {
              liveReady = true;
              break;
            }
          }
        } catch {
          liveReady = false;
        }
      }
      checks.push({
        name: "Live BTC/ETH markets",
        detail: liveReady
          ? `${liveRows.length} live BTC/ETH market${liveRows.length === 1 ? "" : "s"} found and one on-chain status verified.`
          : "No live BTC/ETH market passed the read-only chain verification.",
        state: liveReady ? "READY" : "UNAVAILABLE",
        source: liveReady ? "LIVE" : liveRows.length ? "STALE" : "UNAVAILABLE",
        lastUpdatedAt: liveReady ? checkedAt : null,
      });

      const readyCount = checks.filter((check) => check.state === "READY").length;
      const source: DataSource =
        readyCount === checks.length ? "LIVE" : readyCount ? "STALE" : "UNAVAILABLE";
      return { checks, source, lastUpdatedAt: checkedAt };
    } catch {
      return {
        checks: [
          {
            name: "DreamDEX integration",
            detail: "The Shannon read-only integration is not configured correctly.",
            state: "UNAVAILABLE",
            source: "UNAVAILABLE",
            lastUpdatedAt: null,
          },
        ],
        source: "UNAVAILABLE",
        lastUpdatedAt: null,
      };
    }
  }
}

export function createLiveMarketProvider(): MarketProvider {
  return new LiveMarketProvider();
}
