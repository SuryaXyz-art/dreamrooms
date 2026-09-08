import { describe, expect, it } from "vitest";
import { getFreshness, refreshFreshness } from "@/lib/dreamdex/freshness";
import type { Market } from "@/lib/domain/models";

describe("read freshness", () => {
  it("marks the stale boundary deterministically", () => {
    const now = Date.parse("2026-09-07T12:00:00.000Z");
    expect(getFreshness("2026-09-07T11:59:30.000Z", now, 30_000)).toBe("FRESH");
    expect(getFreshness("2026-09-07T11:59:29.999Z", now, 30_000)).toBe("STALE");
    expect(getFreshness(null, now, 30_000)).toBe("UNKNOWN");
  });

  it("downgrades a live record when its timestamp is old", () => {
    const record = {
      source: "LIVE" as const,
      freshness: "FRESH" as const,
      lastUpdatedAt: "2020-01-01T00:00:00.000Z",
    } satisfies Pick<Market, "source" | "freshness" | "lastUpdatedAt">;

    const stale = refreshFreshness(record);
    expect(stale.source).toBe("STALE");
    expect(stale.freshness).toBe("STALE");
  });
});
