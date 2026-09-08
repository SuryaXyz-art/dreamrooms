import type { DataStamped, Freshness } from "@/lib/domain/models";

export const DEFAULT_STALE_AFTER_MS = 30_000;

export function getFreshness(
  lastUpdatedAt: string | null,
  nowMs = Date.now(),
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
): Freshness {
  if (!lastUpdatedAt) return "UNKNOWN";
  const updatedMs = Date.parse(lastUpdatedAt);
  if (!Number.isFinite(updatedMs)) return "UNKNOWN";
  return nowMs - updatedMs <= staleAfterMs ? "FRESH" : "STALE";
}

export function refreshFreshness<T extends DataStamped>(value: T): T {
  const freshness = getFreshness(value.lastUpdatedAt);
  return {
    ...value,
    freshness,
    source: value.source === "LIVE" && freshness === "STALE" ? "STALE" : value.source,
  };
}
