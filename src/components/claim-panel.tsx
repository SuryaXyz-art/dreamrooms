"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import { SOMNIA_SHANNON_CHAIN_ID, SOMNIA_SHANNON_EXPLORER_URL } from "@/lib/dreamdex/config";
import {
  claimFinalizedPositions,
  discoverFinalizedClaims,
  formatRawAmount,
  TradeLifecycleError,
  type FinalizedClaim,
  type TradeLifecycleState,
  type ClaimExecutionResult,
} from "@/lib/dreamdex/trading";
import { WalletButton } from "@/components/wallet/wallet-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataSourceBadge, StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export function ClaimPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: walletClient } = useWalletClient({ chainId: SOMNIA_SHANNON_CHAIN_ID });
  const [claims, setClaims] = useState<FinalizedClaim[]>([]);
  const [readError, setReadError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [state, setState] = useState<TradeLifecycleState>("review");
  const [detail, setDetail] = useState(
    "Finalized markets are scanned separately from the live-market list.",
  );
  const [result, setResult] = useState<ClaimExecutionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!address || chainId !== SOMNIA_SHANNON_CHAIN_ID) {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setClaims([]);
          setReadError(null);
          setIsReading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsReading(true);
      try {
        const next = await discoverFinalizedClaims(address);
        if (!cancelled) {
          setClaims(next);
          setReadError(null);
        }
      } catch {
        if (!cancelled)
          setReadError(
            "Finalized-market or claimable-position reads are unavailable. Retry shortly.",
          );
      } finally {
        if (!cancelled) setIsReading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, chainId, result?.txHash]);

  async function claimAll() {
    if (!address || !walletClient || !claims.length) return;
    setResult(null);
    try {
      const next = await claimFinalizedPositions({
        claims,
        account: address,
        walletClient,
        onStateChange: (nextState, nextDetail) => {
          setState(nextState);
          if (nextDetail) setDetail(nextDetail);
        },
      });
      setResult(next);
    } catch (error) {
      setDetail(
        error instanceof TradeLifecycleError ? error.message : "The claim did not complete.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brand">Settlements</p>
            <h2 className="mt-1 text-xl font-semibold">Finalized positions</h2>
          </div>
          <DataSourceBadge
            source={
              !isConnected || chainId !== SOMNIA_SHANNON_CHAIN_ID || readError
                ? "UNAVAILABLE"
                : "LIVE"
            }
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          Claimable rows come from the official finalized-market scan and chain-backed outcome
          balances. Already-claimed positions are omitted.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!isConnected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
            <p className="text-sm text-warning">Connect a wallet to scan finalized markets.</p>
            <WalletButton alwaysVisible />
          </div>
        ) : chainId !== SOMNIA_SHANNON_CHAIN_ID ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-failure/30 bg-failure/10 p-4">
            <p className="text-sm text-failure">
              Switch to Somnia Shannon (50312) before reading claims.
            </p>
            <Button
              disabled={isSwitching}
              onClick={() => switchChain({ chainId: SOMNIA_SHANNON_CHAIN_ID })}
            >
              {isSwitching ? "Switching…" : "Switch to Shannon"}
            </Button>
          </div>
        ) : null}
        {isReading ? (
          <p className="text-sm text-muted" role="status">
            Scanning finalized markets and verifying claimable balances…
          </p>
        ) : null}
        {readError ? (
          <p className="rounded-xl border border-failure/30 bg-failure/10 p-3 text-sm text-failure">
            {readError}
          </p>
        ) : null}
        {claims.length ? (
          <div className="grid gap-3">
            {claims.map((claim) => (
              <div
                className="grid gap-2 rounded-xl border border-line bg-page/70 p-4 text-sm sm:grid-cols-[1fr_auto]"
                key={`${claim.marketId}-${claim.outcomeIdx}`}
              >
                <div>
                  <p className="font-semibold">
                    {claim.outcomeIdx === 0 ? "UP" : "DOWN"} · {claim.status}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-muted">
                    Finalized market {claim.marketId}
                  </p>
                </div>
                <dl className="text-left sm:text-right">
                  <div>
                    <dt className="inline text-muted">Position: </dt>
                    <dd className="inline font-mono">
                      {claim.decimals === null
                        ? claim.amount.toString()
                        : formatRawAmount(claim.amount, claim.decimals)}{" "}
                      shares
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-muted">Est. payout: </dt>
                    <dd className="inline font-mono">
                      {claim.decimals === null
                        ? claim.estimatedPayout.toString()
                        : formatRawAmount(claim.estimatedPayout, claim.decimals)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
            <Button
              disabled={
                chainId !== SOMNIA_SHANNON_CHAIN_ID ||
                !walletClient ||
                ["awaiting_signature", "submitted"].includes(state)
              }
              onClick={() => void claimAll()}
            >
              {state === "awaiting_signature"
                ? "Awaiting wallet…"
                : state === "submitted"
                  ? "Confirming claim…"
                  : "Claim all finalized positions"}
            </Button>
          </div>
        ) : !isReading && isConnected && !readError && chainId === SOMNIA_SHANNON_CHAIN_ID ? (
          <p className="rounded-xl border border-line bg-page/70 p-4 text-sm text-muted">
            No finalized, claimable position was found for this wallet. This is a live empty state,
            not a demo claim.
          </p>
        ) : null}
        <div className="flex items-center gap-3">
          <StatusBadge status={state.replaceAll("_", " ")} />
          <p aria-live="polite" className="text-xs text-muted">
            {detail}
          </p>
        </div>
        {result ? (
          <div
            className={cn(
              "rounded-xl border p-4 text-sm",
              result.verified
                ? "border-success/40 bg-success/10"
                : "border-warning/40 bg-warning/10",
            )}
          >
            <p className="font-semibold">
              {result.verified ? "Claim verified" : "Claim receipt confirmed; refresh verification"}
            </p>
            <a
              className="mt-1 block break-all font-mono text-xs text-brand underline"
              href={`${SOMNIA_SHANNON_EXPLORER_URL}/tx/${result.txHash}`}
              rel="noreferrer"
              target="_blank"
            >
              {result.txHash}
            </a>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
