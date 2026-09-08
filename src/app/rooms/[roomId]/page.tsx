import Link from "next/link";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { OrderBookPanel } from "@/components/order-book-panel";
import { MarketSummary } from "@/components/market-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataSourceBadge, StatusBadge } from "@/components/ui/status-badge";
import { createMarketProvider, createRoomProvider } from "@/lib/providers";
import { formatInterval, formatPercent } from "@/lib/utils";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const room = await createRoomProvider().getRoom(roomId);
  if (!room) notFound();
  const book = await createMarketProvider().getOrderBook(room.market.id);
  return (
    <PageLayout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link className="text-sm text-muted hover:text-ink" href="/">
          ← Discover
        </Link>
        <DataSourceBadge source={room.source} />
      </div>
      <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={room.market.status} />
            <span className="text-sm text-muted">{room.participantCount} participants</span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">{room.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{room.description}</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <Card className="border-ink bg-ink text-page">
              <CardContent>
                <p className="text-xs text-muted">UP</p>
                <p className="mt-2 text-3xl font-semibold">↑ {formatPercent(0.62)}</p>
                <Button className="mt-5 w-full" disabled>
                  Take UP later
                </Button>
              </CardContent>
            </Card>
            <Card className="down-pattern border-ink/40">
              <CardContent>
                <p className="text-xs text-muted">DOWN</p>
                <p className="mt-2 text-3xl font-semibold">↓ {formatPercent(0.38)}</p>
                <Button className="mt-5 w-full" disabled variant="danger">
                  Take DOWN later
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Market context</p>
            <h2 className="mt-1 text-xl font-semibold">{room.market.asset} event window</h2>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-muted">Question</dt>
                <dd className="mt-1">{room.market.question}</dd>
              </div>
              <div>
                <dt className="text-muted">Strike</dt>
                <dd className="mt-1 font-semibold">{room.market.strike}</dd>
              </div>
              <div>
                <dt className="text-muted">Cadence</dt>
                <dd className="mt-1">{formatInterval(room.market.intervalSeconds)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>
      <section className="mt-8">
        <MarketSummary market={room.market} book={book} />
      </section>
      <section className="mt-8">
        <OrderBookPanel book={book} />
      </section>
      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Room pulse</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted">
              Participant sentiment, presence and verified fills will appear here once room
              persistence and wallet reads are enabled.
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-panel-strong">
              <div className="h-full w-[62%] bg-ink" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>62% UP</span>
              <span>38% DOWN</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Wallet proof</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted">
              No wallet is connected in this demo room. Read-only market discovery is available;
              Phase 3 will add signed trades and receipt verification.
            </p>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  );
}
