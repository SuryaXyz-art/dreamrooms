"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { SOMNIA_SHANNON_CHAIN_ID } from "@/lib/dreamdex/config";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/ui/status-badge";

interface PortfolioPosition {
  market: {
    id: string;
    asset: string;
    interval: string | null;
    quoteDecimals: number;
    status: string;
  };
  outcomeIndex: number;
  balance: string;
}

interface PortfolioTrade {
  id: string;
  txHash: string;
  quantity: string;
  fillPrice: string;
  market: { asset: string; quoteDecimals: number; interval: string | null };
}

interface PortfolioResponse {
  positions: PortfolioPosition[];
  trades: PortfolioTrade[];
  tradesTruncated: boolean;
}

function formatRaw(value: string, decimals: number): string {
  const raw = BigInt(value);
  const whole = raw / 10n ** BigInt(decimals);
  const fraction = (raw % 10n ** BigInt(decimals)).toString().padStart(decimals, "0").slice(0, 4);
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function PortfolioPositions() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");

  useEffect(() => {
    let cancelled = false;
    if (!address || chainId !== SOMNIA_SHANNON_CHAIN_ID) {
      const reset = window.setTimeout(() => {
        if (!cancelled) {
          setData(null);
          setState("idle");
        }
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(reset);
      };
    }
    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) setState("loading");
    }, 0);
    void fetch(`/api/portfolio?address=${encodeURIComponent(address)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("portfolio unavailable");
        return (await response.json()) as PortfolioResponse;
      })
      .then((next) => {
        if (!cancelled) {
          setData(next);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [address, chainId]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Chain-backed view</p>
            <h2 className="mt-1 text-xl font-semibold">Open positions and verified fills</h2>
          </div>
          <DataSourceBadge
            source={state === "ready" ? "LIVE" : state === "unavailable" ? "UNAVAILABLE" : "STALE"}
          />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        {state === "idle" ? (
          <p className="text-sm text-muted">
            Connect a Shannon wallet to read positions from DreamDEX.
          </p>
        ) : state === "loading" ? (
          <p className="text-sm text-muted" role="status">
            Reading positions and fills…
          </p>
        ) : state === "unavailable" ? (
          <p className="border border-line p-4 text-sm text-muted">
            The portfolio read is unavailable. No zero-value result is being shown.
          </p>
        ) : data && data.positions.length === 0 && data.trades.length === 0 ? (
          <p className="border border-line p-4 text-sm text-muted">
            No indexed open positions or recent fills were found for this wallet.
          </p>
        ) : (
          <>
            {data?.positions.length ? (
              <section aria-labelledby="open-positions-heading">
                <h3 className="mb-3 text-sm font-semibold" id="open-positions-heading">
                  Open positions
                </h3>
                <div className="grid gap-2">
                  {data.positions.map((position) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 border border-line p-3 text-sm"
                      key={`${position.market.id}-${position.outcomeIndex}`}
                    >
                      <span>
                        {position.market.asset} · {position.market.interval ?? "Event"} ·{" "}
                        {position.outcomeIndex === 0 ? "UP" : "DOWN"}
                      </span>
                      <span className="font-mono">
                        {formatRaw(position.balance, position.market.quoteDecimals)} shares ·{" "}
                        {position.market.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {data?.trades.length ? (
              <section aria-labelledby="recent-fills-heading">
                <h3 className="mb-3 text-sm font-semibold" id="recent-fills-heading">
                  Recent fills
                </h3>
                <div className="grid gap-2">
                  {data.trades.slice(0, 10).map((trade) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 border border-line p-3 text-xs"
                      key={trade.id}
                    >
                      <span>
                        {trade.market.asset} ·{" "}
                        {formatRaw(trade.quantity, trade.market.quoteDecimals)} shares
                      </span>
                      <span className="font-mono text-muted">
                        price {formatRaw(trade.fillPrice, trade.market.quoteDecimals)} ·{" "}
                        {trade.txHash.slice(0, 10)}…
                      </span>
                    </div>
                  ))}
                </div>
                {data.tradesTruncated ? (
                  <p className="mt-2 text-xs text-muted">
                    History is limited to the latest indexed page.
                  </p>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
