import Link from "next/link";
import type { Market, OrderBook } from "@/lib/domain/models";
import { formatInterval, formatPercent, formatUpdatedAt } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { DataSourceBadge, StatusBadge } from "@/components/ui/status-badge";
import { LocalizedAction } from "@/components/localized-action";

export function MarketCard({ market, book }: { market: Market; book: OrderBook | undefined }) {
  const upProbability =
    book?.bestUpBid !== null && book?.bestUpAsk !== null && book
      ? (book.bestUpBid + book.bestUpAsk) / 2
      : (book?.bestUpAsk ?? book?.bestUpBid ?? null);
  const downProbability =
    book?.bestDownBid !== null && book?.bestDownAsk !== null && book
      ? (book.bestDownBid + book.bestDownAsk) / 2
      : (book?.bestDownAsk ?? book?.bestDownBid ?? null);
  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg font-semibold">{market.asset}</span>
              <DataSourceBadge source={market.source} />
              {book && book.source !== market.source ? (
                <DataSourceBadge source={book.source} />
              ) : null}
            </div>
            <p className="text-sm text-muted">{market.question}</p>
          </div>
          <StatusBadge status={market.status} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-ink bg-ink p-3 text-page">
            <p className="text-xs opacity-60">↑ UP midpoint</p>
            <p className="mt-1 text-2xl font-semibold">{formatPercent(upProbability)}</p>
          </div>
          <div className="down-pattern rounded-xl border border-ink/40 p-3">
            <p className="text-xs text-muted">↓ DOWN midpoint</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatPercent(downProbability)}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Strike</dt>
            <dd className="mt-1 font-medium">
              {market.resolutionMode === "REFERENCE" ? "Opening reference" : market.strike}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Cadence</dt>
            <dd className="mt-1 font-medium">{formatInterval(market.intervalSeconds)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted">
          Book updated {formatUpdatedAt(book?.lastUpdatedAt ?? market.lastUpdatedAt)} ·{" "}
          {(book?.freshness ?? market.freshness).toLowerCase()}
        </p>
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line bg-panel-strong px-4 text-sm font-semibold text-ink hover:border-ink"
          href={`/rooms/new?marketId=${encodeURIComponent(market.id)}`}
        >
          <LocalizedAction action="createRoom" />
        </Link>
      </CardContent>
    </Card>
  );
}
