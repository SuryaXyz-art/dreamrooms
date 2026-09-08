import { demoMarket, demoOrderBook } from "@/lib/demo/fixtures";
import { emptyOrderBook } from "@/lib/domain/adapters";
import { createLiveMarketProvider } from "@/lib/dreamdex/live-provider";
import type { Asset, DataSource, Market, OrderBook, StatusCheck } from "@/lib/domain/models";

export interface MarketDiscovery {
  markets: Market[];
  orderBooks: Record<string, OrderBook>;
  source: Market["source"];
  message: string;
  lastUpdatedAt: string | null;
}

export interface MarketProviderHealth {
  checks: StatusCheck[];
  source: DataSource;
  lastUpdatedAt: string | null;
}

export interface MarketProvider {
  discoverLiveMarkets(asset?: Asset): Promise<MarketDiscovery>;
  getOrderBook(marketId: string): Promise<OrderBook>;
  getHealth(): Promise<MarketProviderHealth>;
}

class DevelopmentMarketProvider implements MarketProvider {
  async discoverLiveMarkets(asset?: Asset): Promise<MarketDiscovery> {
    const market = asset && asset !== demoMarket.asset ? [] : [demoMarket];
    return {
      markets: market,
      orderBooks: market.length ? { [demoMarket.id]: demoOrderBook } : {},
      source: "DEMO",
      message: "Development fixture only. Disable demo mode to read live DreamDEX markets.",
      lastUpdatedAt: demoMarket.lastUpdatedAt,
    };
  }

  async getHealth(): Promise<MarketProviderHealth> {
    const lastUpdatedAt = new Date().toISOString();
    return {
      checks: [
        {
          name: "DreamRooms provider",
          detail: "Explicit local DEMO mode is active; no live chain data is shown.",
          state: "PENDING",
          source: "DEMO",
          lastUpdatedAt,
        },
      ],
      source: "DEMO",
      lastUpdatedAt,
    };
  }

  async getOrderBook(marketId: string): Promise<OrderBook> {
    if (marketId !== demoOrderBook.marketId) {
      return emptyOrderBook(marketId, "UNAVAILABLE");
    }
    return demoOrderBook;
  }
}

export function createMarketProvider(): MarketProvider {
  return process.env.DREAMROOMS_DATA_MODE === "demo"
    ? new DevelopmentMarketProvider()
    : createLiveMarketProvider();
}
