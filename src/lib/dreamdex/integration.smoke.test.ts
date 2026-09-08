// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createLiveMarketProvider } from "@/lib/dreamdex/live-provider";

const smoke = process.env.RUN_DREAMDEX_SMOKE === "1" ? it : it.skip;

describe("DreamDEX read-only integration smoke", () => {
  smoke(
    "discovers and chain-verifies at least one live BTC/ETH market",
    async () => {
      const discovery = await createLiveMarketProvider().discoverLiveMarkets();
      expect(discovery.source).toBe("LIVE");
      expect(discovery.markets.length).toBeGreaterThan(0);
      expect(discovery.markets.every((market) => market.source === "LIVE")).toBe(true);
    },
    30_000,
  );
});
