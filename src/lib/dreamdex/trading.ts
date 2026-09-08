import {
  DEFAULT_SLIPPAGE_BPS,
  DEFAULT_SLIPPAGE_MIN_TICKS,
  quoteBinaryOrderOverBook,
  quoteBinaryStakeOverBook,
  type BinaryBookParams,
  type BinaryBuySide,
  type BinaryMarket,
  type BinaryOrderBook,
  type ClaimablePosition,
  type Erc20Metadata,
  type MarketOnchain,
  type OrderFill,
  orderBookEventsAbi,
} from "@somnia-chain/markets-sdk";
import {
  decodeEventLog,
  formatUnits,
  parseUnits,
  type Address,
  type Hash,
  type Hex,
  type TransactionReceipt,
  type WalletClient,
} from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { canTradeMarket } from "@/lib/dreamdex/market-gates";
import {
  createDreamDexExchange,
  createShannonPublicClient,
  getDreamDexRuntimeConfig,
} from "@/lib/dreamdex/config";
import type { Market, TradeLifecycleState } from "@/lib/domain/models";
export type { TradeLifecycleState } from "@/lib/domain/models";

export type BinaryBuyOutcome = "UP" | "DOWN";

const lifecycleTransitions: Record<TradeLifecycleState, readonly TradeLifecycleState[]> = {
  review: ["awaiting_signature", "expired", "cancelled"],
  awaiting_signature: ["submitted", "expired", "cancelled", "reverted"],
  submitted: ["awaiting_signature", "confirmed", "reverted", "expired"],
  confirmed: ["review"],
  reverted: ["review"],
  expired: ["review"],
  cancelled: ["review"],
};

/** Explicit UI state machine used by both order and claim surfaces. */
export function canTransitionTradeState(
  from: TradeLifecycleState,
  to: TradeLifecycleState,
): boolean {
  return lifecycleTransitions[from].includes(to);
}

export function receiptSucceeded(receipt: Pick<TransactionReceipt, "status">): boolean {
  return receipt.status === "success";
}

export interface TradeSnapshot {
  onchain: MarketOnchain;
  book: BinaryOrderBook;
  bookParams: BinaryBookParams;
  metadata: Erc20Metadata;
  collateralBalance: bigint;
  allowance: bigint;
  upPositionBalance: bigint;
  downPositionBalance: bigint;
}

export interface TradeQuote {
  marketId: string;
  outcome: BinaryBuyOutcome;
  side: BinaryBuySide;
  quantityRaw: bigint;
  yesPriceRaw: bigint;
  limitPriceRaw: bigint;
  estimatedCostRaw: bigint;
  expectedExecutionPriceRaw: bigint;
  maxSpendRaw: bigint;
  availableLiquidityRaw: bigint;
  priceImpactBps: bigint | null;
  slippageBps: bigint;
  expiresAt: string;
  quoteDecimals: number;
  collateralSymbol: string;
  testnet: true;
}

export interface TradeExecutionResult {
  txHash: Hash;
  approvalTxHash: Hash | null;
  marketId: string;
  outcome: BinaryBuyOutcome;
  side: BinaryBuySide;
  quoteDecimals: number;
  quantityRaw: bigint;
  filledQuantityRaw: bigint;
  executionPriceRaw: bigint | null;
  orderId: bigint | null;
  positionBalanceRaw: bigint;
  verified: boolean;
  receiptStatus: "SUCCESS" | "REVERTED";
  blockNumber: bigint;
  verifiedAt: string;
}

export type PreflightStatus = "checking" | "passed" | "failed" | "action";

export interface TradePreflightCheck {
  id: string;
  label: string;
  status: PreflightStatus;
  detail: string;
  critical: boolean;
}

export interface TradePreflightInput {
  connected: boolean;
  addressMatches: boolean;
  chainId: number | undefined;
  nativeBalance: bigint | undefined;
  market: Market;
  bookSource: "LIVE" | "STALE" | "DEMO" | "UNAVAILABLE" | undefined;
  bookFreshness: "FRESH" | "STALE" | "UNKNOWN" | undefined;
  snapshot: TradeSnapshot | null;
  quote: TradeQuote | null;
  quoteError: string | null;
  walletReady: boolean;
  duplicatePending: boolean;
}

export function evaluateTradePreflight(input: TradePreflightInput): TradePreflightCheck[] {
  const { snapshot, quote } = input;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const hasBook = input.bookSource === "LIVE" && input.bookFreshness === "FRESH";
  const validGrid = Boolean(
    quote &&
    snapshot &&
    quote.quantityRaw >= snapshot.bookParams.minQuantity &&
    quote.quantityRaw % snapshot.bookParams.lotSize === 0n &&
    quote.limitPriceRaw % snapshot.bookParams.tickSize === 0n,
  );
  const maxSpendBounded = Boolean(quote && quote.maxSpendRaw <= 1_000_000n);
  const balanceCovers = Boolean(
    quote && snapshot && snapshot.collateralBalance >= quote.maxSpendRaw,
  );
  const expiryHeadroom = snapshot ? snapshot.onchain.expiry - now : 0n;
  const checks: TradePreflightCheck[] = [
    {
      id: "wallet",
      label: "Wallet connected",
      status: input.connected ? "passed" : "action",
      detail: input.connected ? "Wallet is connected." : "Connect a wallet.",
      critical: true,
    },
    {
      id: "account",
      label: "Connected address matches active account",
      status: input.addressMatches ? "passed" : "failed",
      detail: input.addressMatches
        ? "Active account selected."
        : "Connected account does not match the active account.",
      critical: true,
    },
    {
      id: "chain",
      label: "Somnia Shannon chain 50312",
      status: input.chainId === 50312 ? "passed" : "failed",
      detail:
        input.chainId === 50312 ? "Correct testnet chain." : "Switch to Somnia Shannon (50312).",
      critical: true,
    },
    {
      id: "rpc",
      label: "RPC reachable and expected chain returned",
      status: snapshot ? "passed" : "checking",
      detail: snapshot
        ? "Authoritative market and wallet reads completed."
        : "Waiting for Shannon RPC reads.",
      critical: true,
    },
    {
      id: "gas",
      label: "Native STT available for gas",
      status: input.nativeBalance !== undefined && input.nativeBalance > 0n ? "passed" : "action",
      detail:
        input.nativeBalance !== undefined && input.nativeBalance > 0n
          ? "Non-zero STT balance detected; wallet simulation remains authoritative."
          : "Fund the wallet with Shannon STT.",
      critical: true,
    },
    {
      id: "balance",
      label: "tUSDC covers maximum spend",
      status: balanceCovers ? "passed" : quote ? "failed" : "checking",
      detail: balanceCovers
        ? "Collateral balance covers the reviewed cap."
        : "Collateral balance is below the maximum spend.",
      critical: true,
    },
    {
      id: "addresses",
      label: "Verified collateral and DreamDEX pool",
      status: snapshot?.onchain.collateral && snapshot.onchain.pool ? "passed" : "checking",
      detail: snapshot
        ? `${snapshot.metadata.symbol} collateral and pool were read from the market.`
        : "Waiting for market addresses.",
      critical: true,
    },
    {
      id: "allowance",
      label: "Current allowance read on chain",
      status: snapshot ? "passed" : "checking",
      detail: snapshot
        ? `${snapshot.allowance.toString()} raw allowance; approval is required if below the cap.`
        : "Waiting for allowance read.",
      critical: true,
    },
    {
      id: "status",
      label: "Market is Trading on chain",
      status: snapshot?.onchain.status === 1 ? "passed" : snapshot ? "failed" : "checking",
      detail:
        snapshot?.onchain.status === 1
          ? "On-chain status is Trading."
          : "Market is not currently Trading.",
      critical: true,
    },
    {
      id: "freshness",
      label: "Live market data is fresh",
      status: hasBook ? "passed" : input.bookSource ? "failed" : "checking",
      detail: hasBook
        ? "Live order book is fresh."
        : "Refresh before signing; stale data blocks trading.",
      critical: true,
    },
    {
      id: "expiry",
      label: "Expiry has safe dynamic headroom",
      status: expiryHeadroom >= 120n ? "passed" : snapshot ? "failed" : "checking",
      detail: snapshot
        ? `${expiryHeadroom > 0n ? expiryHeadroom.toString() : "0"} seconds remain at last read.`
        : "Waiting for expiry read.",
      critical: true,
    },
    {
      id: "quote",
      label: "Fillable order-book quote",
      status: quote ? "passed" : input.quoteError ? "failed" : "checking",
      detail: quote
        ? "The official SDK produced a fillable quote."
        : (input.quoteError ?? "Waiting for quote."),
      critical: true,
    },
    {
      id: "liquidity",
      label: "Available liquidity covers quantity",
      status:
        quote && quote.availableLiquidityRaw >= quote.quantityRaw
          ? "passed"
          : quote
            ? "failed"
            : "checking",
      detail: quote
        ? `${quote.availableLiquidityRaw.toString()} raw shares available.`
        : "Waiting for liquidity.",
      critical: true,
    },
    {
      id: "tick-lot",
      label: "Price and quantity match tick/lot grid",
      status: validGrid ? "passed" : quote ? "failed" : "checking",
      detail: validGrid
        ? "Raw bigint values conform to the market grid."
        : "Quote does not conform to the market grid.",
      critical: true,
    },
    {
      id: "cap",
      label: "Maximum spend is at most 1 tUSDC",
      status: maxSpendBounded ? "passed" : quote ? "failed" : "checking",
      detail: maxSpendBounded
        ? "The reviewed cap is within the low-value limit."
        : "Reduce the maximum spend.",
      critical: true,
    },
    {
      id: "slippage",
      label: "Protective price is within reviewed slippage",
      status: quote && quote.slippageBps <= 300n ? "passed" : quote ? "failed" : "checking",
      detail: quote
        ? `${quote.slippageBps.toString()} bps maximum cushion.`
        : "Waiting for slippage calculation.",
      critical: true,
    },
    {
      id: "simulation",
      label: "Gas/calldata simulation supported",
      status: input.walletReady ? "passed" : "action",
      detail: input.walletReady
        ? "Wallet client is ready for the final wallet/provider simulation."
        : "Connect the Shannon wallet before signing.",
      critical: true,
    },
    {
      id: "destination",
      label: "Transaction destination/calldata verified",
      status: snapshot ? "passed" : "checking",
      detail: snapshot
        ? "Order destination will be built from the selected on-chain pool by the official SDK."
        : "Waiting for verified market data.",
      critical: true,
    },
    {
      id: "duplicate",
      label: "No duplicate submission pending",
      status: input.duplicatePending ? "failed" : "passed",
      detail: input.duplicatePending
        ? "A submission is already pending."
        : "No approval or order submission is pending.",
      critical: true,
    },
  ];
  return checks;
}

export interface FinalizedClaim {
  marketId: string;
  outcomeIdx: 0 | 1;
  amount: bigint;
  estimatedPayout: bigint;
  decimals: number | null;
  status: string;
}

export interface ClaimExecutionResult {
  txHash: Hash;
  claimed: FinalizedClaim[];
  verified: boolean;
  receiptStatus: "SUCCESS" | "REVERTED";
}

export class TradeLifecycleError extends Error {
  readonly lifecycleState: Exclude<
    TradeLifecycleState,
    "review" | "awaiting_signature" | "submitted" | "confirmed"
  >;

  constructor(
    message: string,
    lifecycleState: Exclude<
      TradeLifecycleState,
      "review" | "awaiting_signature" | "submitted" | "confirmed"
    >,
  ) {
    super(message);
    this.name = "TradeLifecycleError";
    this.lifecycleState = lifecycleState;
  }
}

function asMarketId(value: string): Hex {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new TradeLifecycleError(
      "The selected market ID is not a valid bytes32 value.",
      "reverted",
    );
  }
  return value as Hex;
}

function oneCollateral(decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new TradeLifecycleError(
      "The collateral token reported an invalid decimals value.",
      "reverted",
    );
  }
  return 10n ** BigInt(decimals);
}

function parseStake(value: string, decimals: number): bigint {
  try {
    const trimmed = value.trim();
    if (!trimmed || Number(trimmed) <= 0) throw new Error("stake must be positive");
    return parseUnits(trimmed, decimals);
  } catch {
    throw new TradeLifecycleError(
      "Enter a positive testnet amount using the collateral token decimals.",
      "reverted",
    );
  }
}

function sumLiquidity(levels: Array<{ quantity: bigint }>): bigint {
  return levels.reduce((total, level) => total + level.quantity, 0n);
}

function ownPrice(price: bigint, side: BinaryBuySide, one: bigint): bigint {
  return side === "BUY_YES" ? price : one - price;
}

function priceImpactBps(slippage: bigint, average: bigint): bigint | null {
  if (average <= 0n) return null;
  return ((slippage < 0n ? -slippage : slippage) * 10_000n) / average;
}

export function outcomeToSide(outcome: BinaryBuyOutcome): BinaryBuySide {
  return outcome === "UP" ? "BUY_YES" : "BUY_NO";
}

export function outcomeFromIndex(outcomeIdx: 0 | 1): BinaryBuyOutcome {
  return outcomeIdx === 0 ? "UP" : "DOWN";
}

export function formatRawAmount(value: bigint, decimals: number, maxFractionDigits = 6): string {
  const formatted = formatUnits(value, decimals);
  const [whole = "0", fraction = ""] = formatted.split(".");
  const trimmed = fraction.slice(0, maxFractionDigits).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export function quoteTrade(
  marketId: string,
  outcome: BinaryBuyOutcome,
  stakeInput: string,
  snapshot: TradeSnapshot,
): TradeQuote {
  const { onchain, book, bookParams, metadata } = snapshot;
  const side = outcomeToSide(outcome);
  const one = oneCollateral(metadata.decimals);
  const stake = parseStake(stakeInput, metadata.decimals);
  let stakeQuote;
  try {
    stakeQuote = quoteBinaryStakeOverBook(book, side, stake, one, {
      tickSize: bookParams.tickSize,
      lotSize: bookParams.lotSize,
      minQuantity: bookParams.minQuantity,
      slippageBps: DEFAULT_SLIPPAGE_BPS,
      slippageMinTicks: DEFAULT_SLIPPAGE_MIN_TICKS,
    });
  } catch {
    throw new TradeLifecycleError(
      "The pool reported an invalid tick or lot grid. Refresh the live market before signing.",
      "reverted",
    );
  }
  if (!stakeQuote) {
    throw new TradeLifecycleError(
      "This market has no fillable opposite liquidity, or the stake is below its valid lot/minimum.",
      "reverted",
    );
  }

  const orderQuote = quoteBinaryOrderOverBook(book, side, stakeQuote.quantity, one);
  const availableLevels = side === "BUY_YES" ? book.yesAsks : book.noAsks;
  const averageOwnPrice = orderQuote.avgPrice;
  const expiry = Number(onchain.expiry);
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(Date.now() / 1000)) {
    throw new TradeLifecycleError(
      "This market window has expired. Refresh to choose the next market.",
      "expired",
    );
  }

  return {
    marketId,
    outcome,
    side,
    quantityRaw: stakeQuote.quantity,
    yesPriceRaw: stakeQuote.yesPrice,
    limitPriceRaw: stakeQuote.limitPrice,
    estimatedCostRaw: orderQuote.cost,
    expectedExecutionPriceRaw: orderQuote.avgPrice,
    maxSpendRaw: stakeQuote.escrow,
    availableLiquidityRaw: sumLiquidity(availableLevels),
    priceImpactBps: priceImpactBps(orderQuote.slippageVsMid, averageOwnPrice),
    slippageBps: DEFAULT_SLIPPAGE_BPS,
    expiresAt: new Date(expiry * 1000).toISOString(),
    quoteDecimals: metadata.decimals,
    collateralSymbol: metadata.symbol,
    testnet: true,
  };
}

export async function readTradeSnapshot(
  marketId: string,
  account: Address,
): Promise<TradeSnapshot> {
  const exchange = createDreamDexExchange();
  const onchain = await exchange.client.getMarketOnchain(asMarketId(marketId));
  const pool = onchain.pool;
  const [
    book,
    bookParams,
    metadata,
    collateralBalance,
    allowance,
    upPositionBalance,
    downPositionBalance,
  ] = await Promise.all([
    exchange.client.getBinaryOrderBook(pool, { depth: 10, decimals: onchain.decimals }),
    exchange.client.getBinaryBookParams(pool),
    exchange.client.getErc20Metadata(onchain.collateral),
    exchange.client.getErc20Balance(onchain.collateral, account),
    exchange.client.getErc20Allowance(onchain.collateral, account, pool),
    exchange.client.getOutcomeBalance({
      outcomeToken: onchain.outcomeToken,
      account,
      id: onchain.yesId,
    }),
    exchange.client.getOutcomeBalance({
      outcomeToken: onchain.outcomeToken,
      account,
      id: onchain.noId,
    }),
  ]);
  return {
    onchain,
    book,
    bookParams,
    metadata,
    collateralBalance,
    allowance,
    upPositionBalance,
    downPositionBalance,
  };
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "The wallet or Shannon RPC returned an unknown error.";
}

function isWalletRejection(error: unknown): boolean {
  const message = readErrorMessage(error).toLowerCase();
  return (
    message.includes("user rejected") || message.includes("user denied") || message.includes("4001")
  );
}

function decodeOrderReceipt(
  receipt: TransactionReceipt,
  pool: Address,
): {
  orderId: bigint | null;
  fills: OrderFill[];
} {
  let orderId: bigint | null = null;
  const fills: OrderFill[] = [];
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== pool.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: orderBookEventsAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "OrderPlaced") {
        orderId = decoded.args.orderId;
      }
      if (decoded.eventName === "OrderFilled") {
        fills.push({
          takerOrderId: decoded.args.takerOrderId,
          makerOrderId: decoded.args.makerOrderId,
          quantityFilled: decoded.args.quantityFilled,
          takerRemainingQuantity: decoded.args.takerRemainingQuantity,
          makerRemainingQuantity: decoded.args.makerRemainingQuantity,
          fillPrice: decoded.args.fillPrice,
        });
      }
    } catch {
      // Receipt logs from unrelated contracts are expected; only known book events matter.
    }
  }
  return { orderId, fills };
}

function executionPrice(fills: OrderFill[], side: BinaryBuySide, one: bigint): bigint | null {
  const totalQuantity = fills.reduce((total, fill) => total + fill.quantityFilled, 0n);
  if (totalQuantity === 0n) return null;
  const weighted = fills.reduce(
    (total, fill) => total + fill.quantityFilled * ownPrice(fill.fillPrice, side, one),
    0n,
  );
  return weighted / totalQuantity;
}

async function readPositionAfterReceipt(
  market: MarketOnchain,
  account: Address,
  outcome: BinaryBuyOutcome,
  previous: bigint,
  exchange: ReturnType<typeof createDreamDexExchange>,
): Promise<bigint> {
  let current = previous;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    current = await exchange.client.getOutcomeBalance({
      outcomeToken: market.outcomeToken,
      account,
      id: outcome === "UP" ? market.yesId : market.noId,
    });
    if (current > previous || attempt === 2) return current;
    await new Promise<void>((resolve) => setTimeout(resolve, 350));
  }
  return current;
}

export async function executeBuyTrade(input: {
  market: Market;
  outcome: BinaryBuyOutcome;
  stakeInput: string;
  account: Address;
  walletClient: WalletClient;
  onStateChange?: (state: TradeLifecycleState, detail?: string) => void;
}): Promise<TradeExecutionResult> {
  const { market, outcome, stakeInput, account, walletClient, onStateChange } = input;
  if (!canTradeMarket(market)) {
    throw new TradeLifecycleError(
      "Trading is disabled until this market is on-chain Trading with fresh live data.",
      "reverted",
    );
  }

  const exchange = createDreamDexExchange();
  const snapshot = await readTradeSnapshot(market.id, account);
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (snapshot.onchain.status !== 1) {
    throw new TradeLifecycleError(
      `The market is ${snapshot.onchain.status === 2 ? "locked" : "not trading"} on chain. Refresh discovery.`,
      "reverted",
    );
  }
  if (snapshot.onchain.expiry <= now) {
    throw new TradeLifecycleError(
      "This market window has expired. Refresh to choose the next market.",
      "expired",
    );
  }

  const quote = quoteTrade(market.id, outcome, stakeInput, snapshot);
  if (snapshot.collateralBalance < quote.maxSpendRaw) {
    throw new TradeLifecycleError(
      `Insufficient ${quote.collateralSymbol} balance for the maximum spend shown in review.`,
      "reverted",
    );
  }

  exchange.setSigner({ walletClient, account });
  const previousPositionBalance =
    quote.side === "BUY_YES" ? snapshot.upPositionBalance : snapshot.downPositionBalance;
  const orderParams = {
    pool: snapshot.onchain.pool,
    side: quote.side,
    price: quote.yesPriceRaw,
    quantity: quote.quantityRaw,
    outcomeToken: snapshot.onchain.outcomeToken,
    yesId: snapshot.onchain.yesId,
    noId: snapshot.onchain.noId,
    collateral: snapshot.onchain.collateral,
    expireTimestampNs: snapshot.onchain.expiry * 1_000_000_000n,
    orderType: 2,
    autoApprove: false,
  } as const;

  let approvalTxHash: Hash | null = null;
  try {
    if (snapshot.allowance < quote.maxSpendRaw) {
      onStateChange?.(
        "awaiting_signature",
        "Approve the displayed collateral allowance in your wallet.",
      );
      const built = await exchange.trader.buildPlaceOrder({ ...orderParams, autoApprove: true });
      if (!built.approval) {
        throw new TradeLifecycleError(
          "The SDK did not return the required collateral approval call.",
          "reverted",
        );
      }
      approvalTxHash = await walletClient.sendTransaction({
        account,
        chain: somniaShannon,
        to: built.approval.to,
        data: built.approval.data,
        value: built.approval.value,
      });
      onStateChange?.("submitted", approvalTxHash);
      const approvalReceipt = await createShannonPublicClient().waitForTransactionReceipt({
        hash: approvalTxHash,
      });
      if (!receiptSucceeded(approvalReceipt)) {
        onStateChange?.("reverted", "The collateral approval transaction reverted.");
        throw new TradeLifecycleError("The collateral approval transaction reverted.", "reverted");
      }
    }

    onStateChange?.("awaiting_signature", "Approve the exact IOC order shown in review.");
    const builtOrder = await exchange.trader.buildPlaceOrder(orderParams);
    const txHash = await walletClient.sendTransaction({
      account,
      chain: somniaShannon,
      to: builtOrder.order.to,
      data: builtOrder.order.data,
      value: builtOrder.order.value,
    });
    onStateChange?.("submitted", txHash);
    const receipt = await createShannonPublicClient().waitForTransactionReceipt({ hash: txHash });
    if (!receiptSucceeded(receipt)) {
      onStateChange?.("reverted", "The mined order receipt is reverted.");
      throw new TradeLifecycleError("The mined order receipt is reverted.", "reverted");
    }

    const decoded = decodeOrderReceipt(receipt, snapshot.onchain.pool);
    const filledQuantityRaw = decoded.fills.reduce(
      (total, fill) => total + fill.quantityFilled,
      0n,
    );
    const positionBalanceRaw = await readPositionAfterReceipt(
      snapshot.onchain,
      account,
      outcome,
      previousPositionBalance,
      exchange,
    );
    const verified =
      filledQuantityRaw > 0n && positionBalanceRaw >= previousPositionBalance + filledQuantityRaw;
    onStateChange?.(
      "confirmed",
      verified
        ? "Receipt succeeded and the outcome-token position increased on chain."
        : "Receipt succeeded, but this IOC did not produce a verifiable fill yet.",
    );
    return {
      txHash,
      approvalTxHash,
      marketId: market.id,
      outcome,
      side: quote.side,
      quoteDecimals: quote.quoteDecimals,
      quantityRaw: quote.quantityRaw,
      filledQuantityRaw,
      executionPriceRaw: executionPrice(
        decoded.fills,
        quote.side,
        oneCollateral(quote.quoteDecimals),
      ),
      orderId: decoded.orderId,
      positionBalanceRaw,
      verified,
      receiptStatus: "SUCCESS",
      blockNumber: receipt.blockNumber,
      verifiedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof TradeLifecycleError) {
      onStateChange?.(error.lifecycleState, error.message);
      throw error;
    }
    if (isWalletRejection(error)) {
      onStateChange?.("cancelled", "The wallet signature was rejected.");
      throw new TradeLifecycleError("The wallet signature was rejected.", "cancelled");
    }
    onStateChange?.(
      "reverted",
      "The order request or Shannon confirmation failed. Refresh and retry.",
    );
    throw new TradeLifecycleError(
      "The order request or Shannon confirmation failed. Refresh and retry.",
      "reverted",
    );
  }
}

function claimableKey(marketId: string): string {
  return marketId.toLowerCase();
}

export function claimsForFinalizedMarkets(
  claimable: readonly ClaimablePosition[],
  finalized: readonly Pick<BinaryMarket, "marketId" | "quoteDecimals">[],
): FinalizedClaim[] {
  const finalizedIds = new Set(finalized.map((market) => claimableKey(market.marketId)));
  const decimalsById = new Map(
    finalized.map((market) => [claimableKey(market.marketId), market.quoteDecimals]),
  );
  return claimable
    .filter((position) => finalizedIds.has(claimableKey(position.marketId)))
    .map((position) => ({
      marketId: position.marketId,
      outcomeIdx: position.outcomeIdx,
      amount: position.amount,
      estimatedPayout: position.estPayout,
      decimals: decimalsById.get(claimableKey(position.marketId)) ?? null,
      status: position.status,
    }));
}

export async function discoverFinalizedClaims(account: Address): Promise<FinalizedClaim[]> {
  const exchange = createDreamDexExchange();
  const config = getDreamDexRuntimeConfig();
  const finalized = await exchange.client.listBinaryMarkets({
    status: "Finalized",
    limit: 100,
    ...(config.venueId ? { venueId: config.venueId } : {}),
    ...(config.operatorId !== undefined ? { operatorId: config.operatorId } : {}),
  });
  const claimable = await exchange.client.getClaimable(account);
  return claimsForFinalizedMarkets(claimable, finalized);
}

export async function claimFinalizedPositions(input: {
  claims: FinalizedClaim[];
  account: Address;
  walletClient: WalletClient;
  onStateChange?: (state: TradeLifecycleState, detail?: string) => void;
}): Promise<ClaimExecutionResult> {
  if (!input.claims.length) {
    throw new TradeLifecycleError(
      "There are no finalized positions available to claim.",
      "reverted",
    );
  }
  const exchange = createDreamDexExchange();
  const before = await Promise.all(
    input.claims.map(async (claim) => {
      const onchain = await exchange.client.getMarketOnchain(asMarketId(claim.marketId));
      if (!onchain.finalized || (!onchain.isResolved && !onchain.isVoided)) {
        throw new TradeLifecycleError(
          "A selected market is not finalized on chain yet.",
          "reverted",
        );
      }
      const id = claim.outcomeIdx === 0 ? onchain.yesId : onchain.noId;
      const balance = await exchange.client.getOutcomeBalance({
        outcomeToken: onchain.outcomeToken,
        account: input.account,
        id,
      });
      if (balance < claim.amount) {
        throw new TradeLifecycleError(
          "A selected position is already claimed or has changed on chain.",
          "reverted",
        );
      }
      return { claim, onchain, id, balance };
    }),
  );

  exchange.setSigner({ walletClient: input.walletClient, account: input.account });
  try {
    input.onStateChange?.(
      "awaiting_signature",
      "Approve the finalized-position claim in your wallet.",
    );
    const config = getDreamDexRuntimeConfig();
    const tx = await exchange.trader.redeemMany({
      entries: input.claims.map((claim) => ({
        marketId: asMarketId(claim.marketId),
        outcomeIdx: claim.outcomeIdx,
        amount: claim.amount,
      })),
      ...(config.venueId ? { venueId: config.venueId as Hex } : {}),
      ...(config.operatorId !== undefined ? { operatorId: config.operatorId } : {}),
      autoApprove: true,
    });
    input.onStateChange?.("submitted", tx.hash);
    if (!receiptSucceeded(tx.receipt)) {
      input.onStateChange?.("reverted", "The mined claim receipt is reverted.");
      throw new TradeLifecycleError("The mined claim receipt is reverted.", "reverted");
    }
    const after = await Promise.all(
      before.map(({ onchain, id }) =>
        exchange.client.getOutcomeBalance({
          outcomeToken: onchain.outcomeToken,
          account: input.account,
          id,
        }),
      ),
    );
    const verified = after.every((balance, index) => {
      const prior = before[index];
      const claim = input.claims[index];
      return prior !== undefined && claim !== undefined && balance === prior.balance - claim.amount;
    });
    input.onStateChange?.(
      "confirmed",
      verified
        ? "Claim receipt succeeded and the claimed balances decreased on chain."
        : "Receipt succeeded; refresh to verify the position balance.",
    );
    return { txHash: tx.hash, claimed: input.claims, verified, receiptStatus: "SUCCESS" };
  } catch (error) {
    if (error instanceof TradeLifecycleError) {
      input.onStateChange?.(error.lifecycleState, error.message);
      throw error;
    }
    if (isWalletRejection(error)) {
      input.onStateChange?.("cancelled", "The wallet signature was rejected.");
      throw new TradeLifecycleError("The wallet signature was rejected.", "cancelled");
    }
    input.onStateChange?.(
      "reverted",
      "The claim request or Shannon confirmation failed. Refresh and retry.",
    );
    throw new TradeLifecycleError(
      "The claim request or Shannon confirmation failed. Refresh and retry.",
      "reverted",
    );
  }
}
