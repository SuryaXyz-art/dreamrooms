import { describe, expect, it } from "vitest";
import {
  activeParticipantCount,
  aggregateSentiment,
  verifiedLeaderboard,
} from "@/lib/supabase/social-state";

describe("social state invariants", () => {
  it("keeps sentiment totals correct across 100 deterministic updates", () => {
    const rows: Array<{ side: "UP" | "DOWN" }> = [];
    for (let index = 0; index < 100; index += 1) {
      rows.push({ side: index % 3 === 0 ? "DOWN" : "UP" });
      const result = aggregateSentiment(rows);
      expect(result.total).toBe(index + 1);
      expect(result.up + result.down).toBe(result.total);
    }
    expect(aggregateSentiment(rows)).toEqual({ up: 66, down: 34, total: 100 });
  });

  it("expires presence deterministically", () => {
    const now = Date.parse("2026-09-09T00:00:00.000Z");
    const rows = Array.from({ length: 100 }, (_, index) => ({
      wallet_address: `0x${index.toString(16).padStart(40, "0")}`,
      last_seen_at: new Date(now - index * 1_000).toISOString(),
    }));
    expect(activeParticipantCount(rows, now)).toBe(90);
    expect(activeParticipantCount(rows, now, 30_000)).toBe(30);
  });

  it("ranks only supplied verified trade rows", () => {
    const rows = Array.from({ length: 100 }, (_, index) => ({
      wallet_address: `0x${(index % 2).toString().padStart(40, "0")}`,
      side: index % 2 === 0 ? ("UP" as const) : ("DOWN" as const),
    }));
    const leaderboard = verifiedLeaderboard(rows);
    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0]?.verifiedTradeCount).toBe(50);
    expect((leaderboard[0]?.up ?? 0) + (leaderboard[0]?.down ?? 0)).toBe(50);
  });
});
