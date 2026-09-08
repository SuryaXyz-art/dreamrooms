import { normalizeMarket, normalizeOrderBook, type RawMarketRecord } from "@/lib/domain/adapters";
import type { OrderBook, Room } from "@/lib/domain/models";

const rawDemoMarket: RawMarketRecord = {
  id: "demo-btc-shannon-window",
  asset: "BTC",
  question: "Will BTC close above its opening reference price?",
  strike: "$96,500",
  intervalSec: 900,
  tradingStart: "2026-09-07T14:00:00.000Z",
  expiry: "2026-09-07T14:15:00.000Z",
  status: "TRADING",
  venueId: "demo-only",
  operatorId: 0,
  poolAddress: null,
  marketAddress: null,
  upSymbol: "BTC-DEMO#UP",
  downSymbol: "BTC-DEMO#DOWN",
};

export const demoMarket = normalizeMarket(rawDemoMarket, "DEMO");

export const demoOrderBook: OrderBook = normalizeOrderBook(
  {
    marketId: demoMarket.id,
    upBids: [
      { price: 0.61, quantity: 12 },
      { price: 0.58, quantity: 24 },
    ],
    upAsks: [
      { price: 0.64, quantity: 9 },
      { price: 0.67, quantity: 18 },
    ],
    downBids: [
      { price: 0.36, quantity: 9 },
      { price: 0.33, quantity: 18 },
    ],
    downAsks: [
      { price: 0.39, quantity: 12 },
      { price: 0.42, quantity: 24 },
    ],
  },
  "DEMO",
);

export const demoRoom: Room = {
  id: "demo-room",
  title: "BTC close: above or below?",
  description: "A design-system fixture showing how a prediction room will feel.",
  market: demoMarket,
  hostAddress: null,
  participantCount: 18,
  createdAt: "2026-09-07T13:55:00.000Z",
  visibility: "PUBLIC",
  source: "DEMO",
  freshness: "UNKNOWN",
  lastUpdatedAt: "2026-09-07T14:04:00.000Z",
};
