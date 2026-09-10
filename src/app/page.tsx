import Link from "next/link";
import { PageHeading, PageLayout } from "@/components/page-layout";
import { MarketCard } from "@/components/market-card";
import { RoomPreview } from "@/components/room-preview";
import { EmptyState } from "@/components/empty-state";
import { DataSourceBadge } from "@/components/ui/status-badge";
import { createMarketProvider, createRoomProvider } from "@/lib/providers";
import { LocalizedAction } from "@/components/localized-action";
import { LiveSignalTrace } from "@/components/live-signal-trace";
import { ProjectInformation } from "@/components/project-information";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const marketProvider = createMarketProvider();
  const roomProvider = createRoomProvider();
  const [discovery, rooms] = await Promise.all([
    marketProvider.discoverLiveMarkets(),
    roomProvider.listRooms(),
  ]);
  const signalValues = discovery.markets
    .map(
      (market) =>
        discovery.orderBooks[market.id]?.bestUpAsk ?? discovery.orderBooks[market.id]?.bestUpBid,
    )
    .filter((value): value is number => value !== null && value !== undefined);

  return (
    <PageLayout>
      <section className="mb-14 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <DataSourceBadge source={discovery.source} />
          <h1 className="display-type mt-5 max-w-3xl text-5xl leading-[0.98] sm:text-8xl">
            Make the room before the market moves.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            DreamRooms gives every prediction a place to gather: compare community conviction with
            transparent market odds.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-page hover:bg-muted"
              href="/rooms/new"
            >
              <LocalizedAction action="createRoom" />
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-panel-strong px-4 text-sm font-semibold text-ink hover:border-ink"
              href="#how-it-works"
            >
              <LocalizedAction action="howItWorks" />
            </Link>
          </div>
        </div>
        <div className="hairline-grid rounded-xl border border-line bg-panel p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">The room signal</p>
          <p className="mt-5 text-3xl font-semibold">People bring the context.</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Markets bring the odds. A shared room makes the tension visible.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-ink bg-ink p-4 text-page">
              <p className="text-xs opacity-60">↑ UP</p>
              <p className="mt-2 text-2xl font-semibold">conviction</p>
            </div>
            <div className="down-pattern rounded-xl border border-ink/40 p-4">
              <p className="text-xs text-muted">↓ DOWN</p>
              <p className="mt-2 text-2xl font-semibold text-ink">conviction</p>
            </div>
          </div>
        </div>
      </section>
      <PageHeading
        eyebrow="Market discovery"
        title="Start with a live window."
        body="Each card is discovered from the configured DreamDEX testnet indexer and checked against chain head before it is shown as live."
        action={
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-panel-strong px-4 py-2 text-sm font-semibold text-ink hover:border-ink"
            href="/rooms/new"
          >
            <LocalizedAction action="browseMarkets" />
          </Link>
        }
      />
      <section className="grid gap-5 lg:grid-cols-2">
        {discovery.markets.length ? (
          discovery.markets.map((market) => (
            <MarketCard key={market.id} book={discovery.orderBooks[market.id]} market={market} />
          ))
        ) : (
          <div className="lg:col-span-2">
            <EmptyState title="No live BTC/ETH markets available" body={discovery.message} />
          </div>
        )}
      </section>
      <div className="mt-6">
        <LiveSignalTrace source={discovery.source} values={signalValues} />
      </div>
      <section className="mt-14">
        <PageHeading
          eyebrow="Community rooms"
          title="Where conviction gets social."
          body="Rooms are the shared layer around a market: a title, a thesis, and the people willing to take a side."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {rooms.length ? (
            rooms.map((room) => <RoomPreview key={room.id} room={room} />)
          ) : (
            <EmptyState
              title="No rooms available"
              body="Be the first host: choose a live market, add your thesis and share the room."
            />
          )}
        </div>
      </section>
      <ProjectInformation />
      <section
        className="mt-14 rounded-xl border border-line bg-panel p-6 sm:p-8"
        id="how-it-works"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">How it works</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold text-brand">01</p>
            <h2 className="mt-2 font-semibold">Find a window</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Choose a BTC or ETH event with clear timing and odds.
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-brand">02</p>
            <h2 className="mt-2 font-semibold">Read the room</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              See where the group leans before taking a position.
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-brand">03</p>
            <h2 className="mt-2 font-semibold">Verify on-chain</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Every trade and claim ends with a wallet-verifiable state.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
