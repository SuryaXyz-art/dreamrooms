"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import type { Market, OrderBook } from "@/lib/domain/models";
import { canTradeMarket } from "@/lib/dreamdex/market-gates";
import {
  executeBuyTrade,
  evaluateTradePreflight,
  formatRawAmount,
  quoteTrade,
  readTradeSnapshot,
  TradeLifecycleError,
  type BinaryBuyOutcome,
  type TradeLifecycleState,
  type TradeQuote,
  type TradeSnapshot,
  type TradeExecutionResult,
} from "@/lib/dreamdex/trading";
import { SOMNIA_SHANNON_CHAIN_ID, SOMNIA_SHANNON_EXPLORER_URL } from "@/lib/dreamdex/config";
import { WalletButton } from "@/components/wallet/wallet-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataSourceBadge, StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function stateLabel(state: TradeLifecycleState): string {
  return state.replaceAll("_", " ");
}

function quoteFailure(
  snapshot: TradeSnapshot | null,
  stake: string,
  outcome: BinaryBuyOutcome,
  marketId: string,
): string | null {
  if (!snapshot) return "Connect on Shannon to read the collateral, approval and valid lot grid.";
  try {
    quoteTrade(marketId, outcome, stake, snapshot);
    return null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "This amount cannot be quoted against the live book.";
  }
}

export function TradePanel({ market, book }: { market: Market; book: OrderBook | undefined }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: walletClient } = useWalletClient({ chainId: SOMNIA_SHANNON_CHAIN_ID });
  const nativeBalance = useBalance({
    address,
    chainId: SOMNIA_SHANNON_CHAIN_ID,
    query: { enabled: Boolean(address && chainId === SOMNIA_SHANNON_CHAIN_ID) },
  });
  const [outcome, setOutcome] = useState<BinaryBuyOutcome>("UP");
  const [stake, setStake] = useState("1");
  const [snapshot, setSnapshot] = useState<TradeSnapshot | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [lifecycleState, setLifecycleState] = useState<TradeLifecycleState>("review");
  const [lifecycleDetail, setLifecycleDetail] = useState(
    "Review the exact market, amount and protective limit before signing.",
  );
  const [execution, setExecution] = useState<TradeExecutionResult | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!address || chainId !== SOMNIA_SHANNON_CHAIN_ID || market.source !== "LIVE") {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setSnapshot(null);
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
        const next = await readTradeSnapshot(market.id, address);
        if (!cancelled) {
          setSnapshot(next);
          setReadError(null);
        }
      } catch {
        if (!cancelled) {
          setSnapshot(null);
          setReadError("Live balance, approval or book reads are unavailable. Retry shortly.");
        }
      } finally {
        if (!cancelled) setIsReading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, chainId, market.id, market.source]);

  const quoteError = useMemo(
    () => quoteFailure(snapshot, stake, outcome, market.id),
    [market.id, outcome, snapshot, stake],
  );
  const quote = useMemo<TradeQuote | null>(() => {
    if (!snapshot || quoteError) return null;
    return quoteTrade(market.id, outcome, stake, snapshot);
  }, [market.id, outcome, quoteError, snapshot, stake]);
  const preflightChecks = useMemo(
    () =>
      evaluateTradePreflight({
        connected: isConnected,
        addressMatches: Boolean(address),
        chainId,
        nativeBalance: nativeBalance.data?.value,
        market,
        bookSource: book?.source,
        bookFreshness: book?.freshness,
        snapshot,
        quote,
        quoteError,
        walletReady: Boolean(walletClient),
        duplicatePending: isSubmitting,
      }),
    [
      address,
      book,
      chainId,
      isConnected,
      isSubmitting,
      market,
      nativeBalance.data?.value,
      quote,
      quoteError,
      snapshot,
      walletClient,
    ],
  );
  const preflightPassed = preflightChecks.every((check) => check.status === "passed");
  const canSign = Boolean(
    isConnected &&
    address &&
    walletClient &&
    chainId === SOMNIA_SHANNON_CHAIN_ID &&
    canTradeMarket(market) &&
    book?.source === "LIVE" &&
    snapshot &&
    quote &&
    !isReading &&
    !isSubmitting &&
    preflightPassed &&
    !quoteError &&
    !["awaiting_signature", "submitted"].includes(lifecycleState),
  );

  async function placeOrder() {
    if (!address || !walletClient || !quote || isSubmitting) return;
    setIsSubmitting(true);
    setExecution(null);
    try {
      const result = await executeBuyTrade({
        market,
        outcome,
        stakeInput: stake,
        account: address,
        walletClient,
        onStateChange: (state, detail) => {
          setLifecycleState(state);
          if (detail) setLifecycleDetail(detail);
        },
      });
      setExecution(result);
    } catch (error) {
      const message =
        error instanceof TradeLifecycleError ? error.message : "The order did not complete.";
      setLifecycleDetail(message);
      if (!(error instanceof TradeLifecycleError)) setLifecycleState("reverted");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyEvidence() {
    if (!execution) return;
    const evidence = JSON.stringify(
      {
        transactionHash: execution.txHash,
        approvalTransactionHash: execution.approvalTxHash,
        blockNumber: execution.blockNumber.toString(),
        chainId: SOMNIA_SHANNON_CHAIN_ID,
        wallet: execution.txHash
          ? `${address?.slice(0, 6) ?? ""}…${address?.slice(-4) ?? ""}`
          : null,
        marketId: execution.marketId,
        side: execution.outcome,
        requestedQuantityRaw: execution.quantityRaw.toString(),
        filledQuantityRaw: execution.filledQuantityRaw.toString(),
        executionPriceRaw: execution.executionPriceRaw?.toString() ?? null,
        receiptStatus: execution.receiptStatus,
        positionVerification: execution.verified ? "VERIFIED" : "UNVERIFIED",
        verifiedAtUtc: execution.verifiedAt,
      },
      null,
      2,
    );
    await navigator.clipboard.writeText(evidence);
    setLifecycleDetail("Verified public evidence JSON copied to the clipboard.");
  }

  function downloadEvidence() {
    if (!execution) return;
    const evidence = JSON.stringify(
      {
        transactionHash: execution.txHash,
        approvalTransactionHash: execution.approvalTxHash,
        blockNumber: execution.blockNumber.toString(),
        chainId: SOMNIA_SHANNON_CHAIN_ID,
        wallet: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null,
        marketId: execution.marketId,
        side: execution.outcome,
        requestedQuantityRaw: execution.quantityRaw.toString(),
        filledQuantityRaw: execution.filledQuantityRaw.toString(),
        executionPriceRaw: execution.executionPriceRaw?.toString() ?? null,
        receiptStatus: execution.receiptStatus,
        positionVerification: execution.verified ? "VERIFIED" : "UNVERIFIED",
        verifiedAtUtc: execution.verifiedAt,
      },
      null,
      2,
    );
    const url = URL.createObjectURL(new Blob([evidence], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `dreamrooms-trade-${execution.txHash.slice(2, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="sticky bottom-0 z-30 border-ink/20 bg-panel hairline-grid sm:static">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brand">Testnet trade</p>
            <h2 className="mt-1 text-xl font-semibold">
              Back {market.asset} {outcome}
            </h2>
          </div>
          <DataSourceBadge source={market.source} />
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          Wallet-signed IOC only. The order is re-read from Shannon immediately before signing; no
          simulated fill is shown as real.
        </p>
      </CardHeader>
      <CardContent className="grid gap-5">
        {!isConnected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
            <p className="text-sm text-warning">
              Connect an injected wallet to read real balances and approvals.
            </p>
            <WalletButton alwaysVisible />
          </div>
        ) : chainId !== SOMNIA_SHANNON_CHAIN_ID ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-failure/30 bg-failure/10 p-4">
            <div>
              <p className="text-sm font-semibold text-failure">Wrong network</p>
              <p className="mt-1 text-xs text-muted">
                Signing is blocked until the wallet is on Somnia Shannon (50312).
              </p>
            </div>
            <Button
              disabled={isSwitching}
              onClick={() => switchChain({ chainId: SOMNIA_SHANNON_CHAIN_ID })}
            >
              {isSwitching ? "Switching…" : "Switch to Shannon"}
            </Button>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div className="grid gap-2">
            <span className="text-sm font-medium">Outcome</span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose outcome">
              {(["UP", "DOWN"] as const).map((candidate) => (
                <Button
                  className={cn(
                    candidate === "UP" ? "border-success/50" : "border-failure/50",
                    outcome === candidate && "ring-2 ring-brand",
                  )}
                  key={candidate}
                  onClick={() => {
                    setOutcome(candidate);
                    setLifecycleState("review");
                  }}
                  variant="secondary"
                >
                  {candidate}
                </Button>
              ))}
            </div>
          </div>
          <label className="grid gap-2 text-sm font-medium" htmlFor={`stake-${market.id}`}>
            Max spend / loss ({snapshot?.metadata.symbol ?? "collateral"})
            <Input
              id={`stake-${market.id}`}
              inputMode="decimal"
              min="0"
              onChange={(event) => {
                setStake(event.target.value);
                setLifecycleState("review");
              }}
              placeholder="1.00"
              step="any"
              type="number"
              value={stake}
            />
          </label>
        </div>

        <div className="grid gap-3 rounded-xl border border-line bg-page/70 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Wallet gas balance</span>
            <span className="font-mono">
              {nativeBalance.data
                ? `${formatRawAmount(nativeBalance.data.value, nativeBalance.data.decimals, 5)} ${nativeBalance.data.symbol}`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Collateral balance</span>
            <span className="font-mono">
              {snapshot
                ? `${formatRawAmount(snapshot.collateralBalance, snapshot.metadata.decimals)} ${snapshot.metadata.symbol}`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Pool allowance</span>
            <span className="font-mono">
              {snapshot
                ? `${formatRawAmount(snapshot.allowance, snapshot.metadata.decimals)} ${snapshot.metadata.symbol}`
                : "—"}
            </span>
          </div>
          <p className="text-xs leading-5 text-muted">
            A short allowance triggers a separate exact ERC-20 approval prompt before the order. No
            private key is needed.
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Current UP / DOWN position</span>
            <span className="font-mono">
              {snapshot
                ? `${formatRawAmount(snapshot.upPositionBalance, snapshot.metadata.decimals)} / ${formatRawAmount(snapshot.downPositionBalance, snapshot.metadata.decimals)} shares`
                : "—"}
            </span>
          </div>
        </div>

        {isReading ? (
          <p className="text-sm text-muted" role="status">
            Reading chain balance, approval, grid and live book…
          </p>
        ) : null}
        {readError ? (
          <p className="rounded-xl border border-failure/30 bg-failure/10 p-3 text-sm text-failure">
            {readError}
          </p>
        ) : null}
        {!canTradeMarket(market) || book?.source !== "LIVE" ? (
          <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            Trading is disabled until the on-chain status is Trading and the live quote is fresh.
          </p>
        ) : null}
        {quoteError ? (
          <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            {quoteError}
          </p>
        ) : null}

        <section
          aria-labelledby={`preflight-${market.id}`}
          className="grid gap-3 rounded-xl border border-line bg-page/70 p-4"
        >
          <div>
            <h3 className="font-semibold" id={`preflight-${market.id}`}>
              Automated preflight
            </h3>
            <p className="mt-1 text-xs text-muted">
              Every critical check must pass before a wallet prompt can open.
            </p>
          </div>
          <ul className="grid gap-2 text-xs" aria-live="polite">
            {preflightChecks.map((check) => (
              <li className="flex items-start gap-2" key={check.id}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    check.status === "passed"
                      ? "bg-success/20 text-success"
                      : check.status === "failed"
                        ? "bg-failure/20 text-failure"
                        : check.status === "action"
                          ? "bg-warning/20 text-warning"
                          : "bg-muted/20 text-muted",
                  )}
                >
                  {check.status === "passed"
                    ? "✓"
                    : check.status === "failed"
                      ? "!"
                      : check.status === "action"
                        ? "→"
                        : "…"}
                </span>
                <span>
                  <strong>{check.label}</strong>
                  <span className="text-muted"> — {check.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {quote ? (
          <div className="grid gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">Review before wallet signature</span>
              <StatusBadge status="Shannon testnet" />
            </div>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-muted">Market</dt>
                <dd className="break-all font-mono text-xs">{quote.marketId}</dd>
              </div>
              <div>
                <dt className="text-muted">Side</dt>
                <dd>{quote.outcome} · IOC</dd>
              </div>
              <div>
                <dt className="text-muted">Snapped quantity</dt>
                <dd className="font-mono">
                  {formatRawAmount(quote.quantityRaw, quote.quoteDecimals)} shares
                </dd>
              </div>
              <div>
                <dt className="text-muted">Expected execution price</dt>
                <dd className="font-mono">
                  {formatRawAmount(quote.expectedExecutionPriceRaw, quote.quoteDecimals, 6)}{" "}
                  probability
                </dd>
              </div>
              <div>
                <dt className="text-muted">Estimated cost</dt>
                <dd className="font-mono">
                  {formatRawAmount(quote.estimatedCostRaw, quote.quoteDecimals)}{" "}
                  {quote.collateralSymbol}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Protective limit</dt>
                <dd className="font-mono">
                  {formatRawAmount(quote.limitPriceRaw, quote.quoteDecimals, 6)} probability
                </dd>
              </div>
              <div>
                <dt className="text-muted">Raw YES-term price</dt>
                <dd className="font-mono">{quote.yesPriceRaw.toString()}</dd>
              </div>
              <div>
                <dt className="text-muted">Maximum spend / loss</dt>
                <dd className="font-mono">
                  {formatRawAmount(quote.maxSpendRaw, quote.quoteDecimals)} {quote.collateralSymbol}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Available liquidity</dt>
                <dd className="font-mono">
                  {formatRawAmount(quote.availableLiquidityRaw, quote.quoteDecimals)} shares
                </dd>
              </div>
              <div>
                <dt className="text-muted">Impact vs mid</dt>
                <dd>
                  {quote.priceImpactBps === null
                    ? "—"
                    : `${formatRawAmount(quote.priceImpactBps, 2, 2)}%`}{" "}
                  · {quote.slippageBps.toString()} bps max cushion
                </dd>
              </div>
              <div>
                <dt className="text-muted">Order expiry</dt>
                <dd>{new Date(quote.expiresAt).toLocaleString("en-IN")}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={!canSign} onClick={() => void placeOrder()}>
            {lifecycleState === "awaiting_signature"
              ? "Awaiting wallet…"
              : lifecycleState === "submitted"
                ? "Confirming…"
                : `Review & place ${outcome} IOC`}
          </Button>
          <StatusBadge status={stateLabel(lifecycleState)} />
        </div>
        <p aria-live="polite" className="text-xs leading-5 text-muted">
          {lifecycleDetail}
        </p>

        {execution ? (
          <div
            className={cn(
              "grid gap-2 rounded-xl border p-4 text-sm",
              execution.verified
                ? "border-success/40 bg-success/10"
                : "border-warning/40 bg-warning/10",
            )}
          >
            <p className="font-semibold">
              {execution.verified ? "Verified position" : "Receipt confirmed; no verified fill"}
            </p>
            <p>
              Transaction:{" "}
              <a
                className="break-all font-mono text-brand underline"
                href={`${SOMNIA_SHANNON_EXPLORER_URL}/tx/${execution.txHash}`}
                rel="noreferrer"
                target="_blank"
              >
                {execution.txHash}
              </a>
            </p>
            {execution.approvalTxHash ? (
              <p>
                Approval:{" "}
                <a
                  className="break-all font-mono text-brand underline"
                  href={`${SOMNIA_SHANNON_EXPLORER_URL}/tx/${execution.approvalTxHash}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {execution.approvalTxHash}
                </a>
              </p>
            ) : null}
            <p>
              Market {execution.marketId} · {execution.side} · {execution.outcome} · requested{" "}
              {formatRawAmount(execution.quantityRaw, execution.quoteDecimals)} · filled{" "}
              {formatRawAmount(execution.filledQuantityRaw, execution.quoteDecimals)} shares ·
              execution price{" "}
              {execution.executionPriceRaw === null
                ? "—"
                : formatRawAmount(execution.executionPriceRaw, execution.quoteDecimals, 6)}{" "}
              · position read{" "}
              {formatRawAmount(execution.positionBalanceRaw, execution.quoteDecimals)}.
            </p>
            <p className="text-xs text-muted">
              The receipt status and ERC-6909 balance read are independent verification checks.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void copyEvidence()} type="button" variant="secondary">
                Copy evidence JSON
              </Button>
              <Button onClick={downloadEvidence} type="button" variant="secondary">
                Download evidence JSON
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
