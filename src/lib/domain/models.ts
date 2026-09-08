export type DataSource = "LIVE" | "DEMO" | "STALE" | "UNAVAILABLE";
export type Freshness = "FRESH" | "STALE" | "UNKNOWN";

export type Asset = "BTC" | "ETH";
export type Outcome = "UP" | "DOWN";
export type MarketStatus =
  "LISTED" | "TRADING" | "LOCKED" | "SETTLING" | "RESOLVED" | "VOIDED" | "FINALIZED" | "UNKNOWN";
export type OrderSide = "BUY" | "SELL";
export type TradeLifecycleState =
  | "review"
  | "awaiting_signature"
  | "submitted"
  | "confirmed"
  | "reverted"
  | "expired"
  | "cancelled";
export type OrderState =
  "PREVIEW" | "SUBMITTED" | "FILLED" | "PARTIAL" | "CANCELLED" | "REVERTED" | TradeLifecycleState;

export interface DataStamped {
  source: DataSource;
  freshness: Freshness;
  lastUpdatedAt: string | null;
}

export interface Market extends DataStamped {
  id: string;
  asset: Asset;
  question: string;
  strike: string;
  resolutionMode: "REFERENCE" | "FIXED";
  intervalSeconds: number;
  tradingStart: string;
  expiry: string;
  status: MarketStatus;
  yesTokenId: string | null;
  noTokenId: string | null;
  quoteDecimals: number | null;
  venueId: string | null;
  operatorId: number | null;
  poolAddress: string | null;
  marketAddress: string | null;
  outcomeTokenAddress: string | null;
  collateralAddress: string | null;
  poolNonce: string | null;
  upSymbol: string | null;
  downSymbol: string | null;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBook extends DataStamped {
  marketId: string;
  upBids: OrderBookLevel[];
  upAsks: OrderBookLevel[];
  downBids: OrderBookLevel[];
  downAsks: OrderBookLevel[];
  bestUpBid: number | null;
  bestUpAsk: number | null;
  bestDownBid: number | null;
  bestDownAsk: number | null;
  availableUpBidQuantity: number;
  availableUpAskQuantity: number;
  availableDownBidQuantity: number;
  availableDownAskQuantity: number;
}

export interface TradePreview {
  marketId: string;
  outcome: Outcome;
  side: OrderSide;
  quantity: number;
  limitPrice: number | null;
  estimatedCost: number;
  maxSpend: number;
  availableLiquidity: number;
  priceImpactBps: number | null;
  slippageBps: number;
  expiresAt: string;
  testnet: true;
  orderType: "IOC" | "LIMIT";
}

export interface VerifiedTrade extends DataStamped {
  id: string;
  marketId: string;
  walletAddress: string;
  outcome: Outcome;
  side: OrderSide;
  requestedQuantity: number;
  filledQuantity: number;
  executionPrice: number | null;
  txHash: string | null;
  receiptStatus: "SUCCESS" | "REVERTED" | "PENDING" | "UNKNOWN";
  state: OrderState;
}

export interface Position extends DataStamped {
  marketId: string;
  walletAddress: string;
  upQuantity: number;
  downQuantity: number;
  netOutcome: number;
  averageEntryPrice: number | null;
}

export interface Settlement extends DataStamped {
  marketId: string;
  status: "PENDING" | "RESOLVED" | "VOIDED" | "UNKNOWN";
  winningOutcome: Outcome | null;
  settledAt: string | null;
  claimableUp: number;
  claimableDown: number;
  claimTxHash: string | null;
}

export interface Room extends DataStamped {
  id: string;
  title: string;
  description: string;
  market: Market;
  hostAddress: string | null;
  participantCount: number;
  createdAt: string;
  visibility: "PUBLIC" | "LINK";
}

export interface Participant {
  walletAddress: string;
  displayName: string;
  joinedAt: string;
  outcome: Outcome | null;
  isHost: boolean;
  source: DataSource;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  walletAddress: string;
  conviction: number;
  outcome: Outcome;
  source: DataSource;
}

export interface StatusCheck {
  name: string;
  detail: string;
  state: "READY" | "PENDING" | "UNAVAILABLE";
  source: DataSource;
  lastUpdatedAt: string | null;
}
