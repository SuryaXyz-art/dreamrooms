import type { DataSource } from "@/lib/domain/models";

function tracePath(values: readonly number[]): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 92 - ((value - min) / range) * 70;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function LiveSignalTrace({
  values,
  source,
}: {
  values: readonly number[];
  source: DataSource;
}) {
  const usableValues = values.filter((value) => Number.isFinite(value));
  const isLive = source === "LIVE" && usableValues.length > 1;
  return (
    <section
      className="relative overflow-hidden rounded-xl border border-line bg-panel"
      aria-label="Live market signal"
    >
      <div className="hairline-grid absolute inset-0 opacity-70" aria-hidden="true" />
      {isLive ? (
        <svg
          className="absolute inset-0 h-full w-full opacity-60"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={tracePath(usableValues)}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
      <div className="relative p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">Signal trace</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          {isLive
            ? "A quiet trace of the current live quote set. It is context, not a synthetic price chart."
            : "A live quote trace will appear when the configured market read is fresh."}
        </p>
      </div>
    </section>
  );
}
