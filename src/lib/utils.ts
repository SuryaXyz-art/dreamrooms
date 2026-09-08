export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

export function formatCompactAddress(address: string | null): string {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatInterval(seconds: number): string {
  if (seconds <= 0) return "Window unavailable";
  if (seconds % 3600 === 0) return `${seconds / 3600}h window`;
  return `${Math.round(seconds / 60)}m window`;
}

export function formatUpdatedAt(timestamp: string | null): string {
  if (!timestamp) return "Unavailable";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatUnixTimestamp(timestamp: string | null): string {
  if (!timestamp) return "Unavailable";
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || seconds <= 0) return "Unavailable";
  return formatUpdatedAt(new Date(seconds * 1000).toISOString());
}
