import Link from "next/link";
import { PageHeading, PageLayout } from "@/components/page-layout";
import { EmptyState } from "@/components/empty-state";
import { MarketCard } from "@/components/market-card";
import { OrderBookPanel } from "@/components/order-book-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { DataSourceBadge } from "@/components/ui/status-badge";
import { TradePanel } from "@/components/trade-panel";
import { createMarketProvider } from "@/lib/providers";
import { canTradeMarket } from "@/lib/dreamdex/market-gates";
import { formatUnixTimestamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewRoomPage({
  searchParams,
}: {
  searchParams?: Promise<{ marketId?: string | string[] }>;
}) {
  const discovery = await createMarketProvider().discoverLiveMarkets();
  const requestedMarketId = (await searchParams)?.marketId;
  const selectedMarketId = Array.isArray(requestedMarketId)
    ? requestedMarketId[0]
    : requestedMarketId;
  const market =
    discovery.markets.find((candidate) => candidate.id === selectedMarketId) ??
    discovery.markets[0];
  const orderBook = market ? discovery.orderBooks[market.id] : undefined;
  return (
    <PageLayout>
      <PageHeading
        eyebrow="Room builder"
        title="Give a prediction a home."
        body="Choose a live, chain-verified market below. Room persistence arrives in a later phase."
        action={<DataSourceBadge source={discovery.source} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Room details</p>
            <h2 className="mt-1 text-xl font-semibold">Set the tone</h2>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5">
              <Field hint="Shown at the top of the shared room." label="Room title">
                <Input placeholder="e.g. BTC close: above or below?" />
              </Field>
              <Field label="Your thesis">
                <Textarea placeholder="What should the room pay attention to?" />
              </Field>
              <Field
                hint="Room creation will validate this against the live market in a later phase."
                label="Market"
              >
                <select
                  className="min-h-11 rounded-xl border bg-page px-3 text-ink"
                  defaultValue={market?.id ?? "unavailable"}
                  disabled={!market}
                >
                  {discovery.markets.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.asset} —{" "}
                      {candidate.resolutionMode === "REFERENCE"
                        ? "Opening reference"
                        : candidate.strike}
                    </option>
                  ))}
                  {!market && <option value="unavailable">No live market connected</option>}
                </select>
              </Field>
              <Button disabled>Save room (Phase 3)</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Selected market</p>
            <h2 className="mt-1 text-xl font-semibold">{market ? market.asset : "Unavailable"}</h2>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            {market ? (
              <>
                <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-success">
                  <strong>
                    {market.source === "LIVE"
                      ? "LIVE market verified."
                      : "Market verification needs attention."}
                  </strong>
                  <p className="mt-1 text-xs leading-5">{discovery.message}</p>
                </div>
                <dl className="grid gap-3">
                  <div>
                    <dt className="text-muted">Market ID</dt>
                    <dd className="mt-1 break-all font-mono text-xs">{market.id}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Venue scope</dt>
                    <dd className="mt-1">
                      {market.venueId ?? "Unavailable"} · operator {market.operatorId ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Question</dt>
                    <dd className="mt-1">{market.question}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Strike</dt>
                    <dd className="mt-1">
                      {market.resolutionMode === "REFERENCE"
                        ? "Opening reference price"
                        : market.strike}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Status</dt>
                    <dd className="mt-1">{market.status}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Opens</dt>
                    <dd className="mt-1">{formatUnixTimestamp(market.tradingStart)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Expires</dt>
                    <dd className="mt-1">{formatUnixTimestamp(market.expiry)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Trading gate</dt>
                    <dd className="mt-1">
                      {canTradeMarket(market)
                        ? "On-chain Trading + fresh data"
                        : "Disabled until on-chain Trading + fresh data"}
                    </dd>
                  </div>
                </dl>
                {orderBook ? <OrderBookPanel book={orderBook} /> : null}
              </>
            ) : (
              <p className="text-muted">{discovery.message}</p>
            )}
            <Link
              className="text-sm font-semibold text-ink underline underline-offset-4 hover:text-muted"
              href="/"
            >
              ← Back to discovery
            </Link>
          </CardContent>
        </Card>
      </div>
      <section className="mt-10">
        <PageHeading
          eyebrow="Live discovery"
          title="Choose a verified event window."
          body="Market identity, timing and status come from structured Event Contract fields. No question-text parsing or hardcoded pool is used."
        />
        {discovery.markets.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {discovery.markets.map((candidate) => (
              <MarketCard
                book={discovery.orderBooks[candidate.id]}
                key={candidate.id}
                market={candidate}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No live BTC/ETH markets available" body={discovery.message} />
        )}
      </section>
      {market ? (
        <section className="mt-10" aria-label="Wallet trade">
          <TradePanel book={orderBook} market={market} />
        </section>
      ) : null}
    </PageLayout>
  );
}
