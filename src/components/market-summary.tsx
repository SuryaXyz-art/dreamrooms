"use client";

import { useEffect, useMemo, useState } from "react";
import type { Market, OrderBook } from "@/lib/domain/models";
import { DataSourceBadge, StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/components/app-providers";

function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function MarketSummary({ market, book }: { market: Market; book: OrderBook | undefined }) {
  const [now, setNow] = useState(() => Date.now());
  const [speaking, setSpeaking] = useState(false);
  const { locale, t } = useLocale();
  const end = Number(market.expiry) * 1000;
  const timeLeft = Number.isFinite(end) ? Math.max(0, end - now) : 0;
  const up = book?.bestUpAsk ?? book?.bestUpBid;
  const down = book?.bestDownAsk ?? book?.bestDownBid;
  const summary = useMemo(
    () =>
      `${market.asset} event contract. ${market.question}. ${market.status}. ${formatCountdown(timeLeft)} remaining.`,
    [market.asset, market.question, market.status, timeLeft],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function speakSummary() {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = locale === "hi" ? "hi-IN" : "en-IN";
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <section
      className="rounded-xl border border-line bg-panel p-5 sm:p-8"
      aria-label="Market summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <DataSourceBadge source={market.source} />
          <StatusBadge status={market.status} />
        </div>
        <button
          className="min-h-11 rounded-xl border border-line px-3 text-sm text-muted hover:bg-panel-strong hover:text-ink"
          type="button"
          onClick={speakSummary}
          aria-pressed={speaking}
        >
          {speaking ? t.room.stop : t.room.listen}
        </button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
            {market.asset} event window
          </p>
          <h2 className="display-type mt-2 text-2xl sm:text-4xl">{market.question}</h2>
          <p className="mt-3 text-sm text-muted">
            {market.resolutionMode === "REFERENCE"
              ? "Opening reference price"
              : `Strike ${market.strike}`}{" "}
            · Market ID <span className="font-mono text-xs">{market.id.slice(0, 10)}…</span>
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-page/70 px-5 py-4 lg:min-w-64">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{t.room.expiry}</p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums" aria-live="polite">
            {formatCountdown(timeLeft)}
          </p>
          <p className="mt-1 text-xs text-muted">{timeLeft ? t.room.open : t.room.closed}</p>
        </div>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3" aria-label="Live probability comparison">
        <div className="rounded-xl border border-ink bg-ink p-4 text-page">
          <p className="text-xs opacity-60">↑ {t.room.upProbability}</p>
          <p className="mt-2 text-3xl font-semibold">
            {up === null || up === undefined ? "—" : `${Math.round(up * 100)}%`}
          </p>
        </div>
        <div className="down-pattern rounded-xl border border-ink/40 p-4">
          <p className="text-xs text-muted">↓ {t.room.downProbability}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {down === null || down === undefined ? "—" : `${Math.round(down * 100)}%`}
          </p>
        </div>
      </div>
      <p className="mt-5 text-xs leading-5 text-muted">{t.room.risk}</p>
    </section>
  );
}
