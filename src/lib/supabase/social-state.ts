export interface SentimentRow {
  side: "UP" | "DOWN";
}

export interface ParticipantRow {
  wallet_address: string;
  last_seen_at: string;
}

export interface VerifiedTradeRow {
  wallet_address: string;
  side: "UP" | "DOWN";
}

export function aggregateSentiment(rows: readonly SentimentRow[]): {
  up: number;
  down: number;
  total: number;
} {
  const up = rows.reduce((count, row) => count + (row.side === "UP" ? 1 : 0), 0);
  return { up, down: rows.length - up, total: rows.length };
}

export function activeParticipantCount(
  rows: readonly ParticipantRow[],
  nowMs = Date.now(),
  ttlMs = 90_000,
): number {
  return rows.filter((row) => {
    const lastSeen = Date.parse(row.last_seen_at);
    return Number.isFinite(lastSeen) && lastSeen > nowMs - ttlMs;
  }).length;
}

export function verifiedLeaderboard(rows: readonly VerifiedTradeRow[]): Array<{
  rank: number;
  walletAddress: string;
  verifiedTradeCount: number;
  up: number;
  down: number;
}> {
  const grouped = new Map<
    string,
    { walletAddress: string; verifiedTradeCount: number; up: number; down: number }
  >();
  for (const row of rows) {
    const walletAddress = row.wallet_address.toLowerCase();
    const current = grouped.get(walletAddress) ?? {
      walletAddress,
      verifiedTradeCount: 0,
      up: 0,
      down: 0,
    };
    current.verifiedTradeCount += 1;
    if (row.side === "UP") current.up += 1;
    else current.down += 1;
    grouped.set(walletAddress, current);
  }
  return [...grouped.values()]
    .sort(
      (left, right) =>
        right.verifiedTradeCount - left.verifiedTradeCount ||
        left.walletAddress.localeCompare(right.walletAddress),
    )
    .map((row, index) => ({ rank: index + 1, ...row }));
}
