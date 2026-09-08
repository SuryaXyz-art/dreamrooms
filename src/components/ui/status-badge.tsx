import { cn } from "@/lib/utils";
import type { DataSource } from "@/lib/domain/models";

const sourceStyles: Record<DataSource, string> = {
  LIVE: "border-success/40 bg-success/10 text-success",
  DEMO: "border-warning/40 bg-warning/10 text-warning",
  STALE: "border-warning/40 bg-warning/10 text-warning",
  UNAVAILABLE: "border-failure/40 bg-failure/10 text-failure",
};

export function DataSourceBadge({ source }: { source: DataSource }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[0.16em]",
        sourceStyles[source],
      )}
    >
      {source}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const symbol =
    normalized.includes("trading") || normalized.includes("ready") || normalized.includes("success")
      ? "✓"
      : normalized.includes("warning") || normalized.includes("pending")
        ? "~"
        : normalized.includes("unavailable") ||
            normalized.includes("failed") ||
            normalized.includes("revert")
          ? "!"
          : "·";
  const style =
    normalized.includes("trading") || normalized.includes("ready") || normalized.includes("success")
      ? "border-success/40 bg-success/10 text-success"
      : normalized.includes("warning") || normalized.includes("pending")
        ? "border-warning/40 bg-warning/10 text-warning"
        : normalized.includes("unavailable") || normalized.includes("failed")
          ? "border-failure/40 bg-failure/10 text-failure"
          : "border-line bg-panel-strong text-muted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        style,
      )}
    >
      <span aria-hidden="true">{symbol}</span>
      {status}
    </span>
  );
}
