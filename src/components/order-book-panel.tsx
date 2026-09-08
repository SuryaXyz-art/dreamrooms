import type { OrderBook } from "@/lib/domain/models";
import { formatPercent } from "@/lib/utils";
import { formatUpdatedAt } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/ui/status-badge";

function LevelList({
  title,
  levels,
  color,
}: {
  title: string;
  levels: Array<{ price: number; quantity: number }>;
  color: "up" | "down";
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{title}</span>
        <span>Size</span>
      </div>
      {levels.length ? (
        levels.map((level) => (
          <div
            className="flex justify-between border-b border-line/50 py-2 text-sm last:border-0"
            key={`${title}-${level.price}`}
          >
            <span className={color === "up" ? "text-up" : "text-down"}>
              {formatPercent(level.price)}
            </span>
            <span className="text-muted">{level.quantity}</span>
          </div>
        ))
      ) : (
        <p className="py-2 text-sm text-muted">No levels yet</p>
      )}
    </div>
  );
}

export function OrderBookPanel({ book }: { book: OrderBook }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Market depth</p>
            <h2 className="mt-1 text-lg font-semibold">Order book preview</h2>
          </div>
          <DataSourceBadge source={book.source} />
        </div>
        <p className="mt-2 text-xs text-muted">
          Updated {formatUpdatedAt(book.lastUpdatedAt)} · {book.freshness.toLowerCase()}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div className="rounded-lg bg-page/60 p-3">
            <dt className="text-muted">UP best bid / ask</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatPercent(book.bestUpBid)} / {formatPercent(book.bestUpAsk)}
            </dd>
          </div>
          <div className="rounded-lg bg-page/60 p-3">
            <dt className="text-muted">DOWN best bid / ask</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatPercent(book.bestDownBid)} / {formatPercent(book.bestDownAsk)}
            </dd>
          </div>
          <div className="rounded-lg bg-page/60 p-3">
            <dt className="text-muted">UP bid / ask depth</dt>
            <dd className="mt-1 font-semibold text-ink">
              {book.availableUpBidQuantity} / {book.availableUpAskQuantity}
            </dd>
          </div>
          <div className="rounded-lg bg-page/60 p-3">
            <dt className="text-muted">DOWN bid / ask depth</dt>
            <dd className="mt-1 font-semibold text-ink">
              {book.availableDownBidQuantity} / {book.availableDownAskQuantity}
            </dd>
          </div>
        </dl>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <LevelList color="up" levels={book.upAsks} title="UP asks" />
        <LevelList color="up" levels={book.upBids} title="UP bids" />
        <LevelList color="down" levels={book.downAsks} title="DOWN asks" />
        <LevelList color="down" levels={book.downBids} title="DOWN bids" />
      </CardContent>
    </Card>
  );
}
