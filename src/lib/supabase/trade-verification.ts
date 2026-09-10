import "server-only";

import { orderBookEventsAbi } from "@somnia-chain/markets-sdk";
import { decodeEventLog, formatUnits, type Address, type Hash } from "viem";
import { createDreamDexExchange, createShannonPublicClient } from "@/lib/dreamdex/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { marketIdSchema } from "@/lib/supabase/schema";

const binaryPoolEventsAbi = [
  {
    type: "event",
    name: "BinaryOrderPlaced",
    inputs: [
      { name: "orderId", type: "uint128", indexed: true },
      { name: "kind", type: "uint8", indexed: false },
    ],
    anonymous: false,
  },
] as const;

type Receipt = Awaited<
  ReturnType<ReturnType<typeof createShannonPublicClient>["getTransactionReceipt"]>
>;

function normalizeAddress(value: string): string {
  return value.toLowerCase();
}

function asHash(value: string): Hash {
  return value as Hash;
}

export interface VerifiedRoomTrade {
  transactionHash: string;
  blockNumber: string;
  marketId: string;
  walletAddress: string;
  side: "UP" | "DOWN";
  requestedQuantity: string;
  filledQuantity: string;
  executionPrice: string | null;
  receiptStatus: "SUCCESS";
  positionVerification: "VERIFIED";
  currentPositionBalance: string;
  verifiedAt: string;
}

function decodeTradeReceipt(receipt: Receipt, pool: Address, wallet: string) {
  let orderId: bigint | null = null;
  let side: "UP" | "DOWN" | null = null;
  let requestedQuantity = 0n;
  let filledQuantity = 0n;
  let weightedPrice = 0n;
  for (const log of receipt.logs) {
    if (normalizeAddress(log.address) !== normalizeAddress(pool)) continue;
    try {
      const decoded = decodeEventLog({
        abi: orderBookEventsAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "OrderPlaced") {
        if (normalizeAddress(decoded.args.placedOrder.owner) !== normalizeAddress(wallet)) continue;
        orderId = decoded.args.orderId;
        requestedQuantity = decoded.args.placedOrder.fullQuantity;
      }
    } catch {
      try {
        const decoded = decodeEventLog({
          abi: binaryPoolEventsAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "BinaryOrderPlaced") {
          if (decoded.args.kind === 0) side = "UP";
          if (decoded.args.kind === 2) side = "DOWN";
        }
      } catch {
        // Unrelated logs and events from the paired order book are expected.
      }
    }
  }
  for (const log of receipt.logs) {
    if (normalizeAddress(log.address) !== normalizeAddress(pool)) continue;
    try {
      const decoded = decodeEventLog({
        abi: orderBookEventsAbi,
        data: log.data,
        topics: log.topics,
      });
      if (
        decoded.eventName === "OrderFilled" &&
        orderId !== null &&
        decoded.args.takerOrderId === orderId
      ) {
        filledQuantity += decoded.args.quantityFilled;
        weightedPrice += decoded.args.quantityFilled * decoded.args.fillPrice;
      }
    } catch {
      // Ignore non-order-book logs.
    }
  }
  return {
    orderId,
    side,
    requestedQuantity,
    filledQuantity,
    executionPrice: filledQuantity > 0n ? weightedPrice / filledQuantity : null,
  };
}

export async function verifyRoomTrade(input: {
  slug: string;
  walletAddress: Address;
  transactionHash: string;
}): Promise<VerifiedRoomTrade> {
  const client = createSupabaseServerClient();
  const { data: room, error: roomError } = await client
    .from("rooms")
    .select("id, market_id")
    .eq("slug", input.slug)
    .single();
  if (roomError || !room) throw new Error("Room is unavailable.");
  const marketIdResult = marketIdSchema.safeParse(room.market_id);
  if (!marketIdResult.success) throw new Error("Room market is invalid.");
  const exchange = createDreamDexExchange();
  const onchain = await exchange.client.getMarketOnchain(marketIdResult.data as `0x${string}`);
  const publicClient = createShannonPublicClient();
  const receipt = await publicClient.getTransactionReceipt({ hash: asHash(input.transactionHash) });
  const transaction = await publicClient.getTransaction({ hash: asHash(input.transactionHash) });
  if (receipt.status !== "success") throw new Error("The order receipt reverted.");
  if (normalizeAddress(transaction.from) !== normalizeAddress(input.walletAddress))
    throw new Error("Transaction sender does not match the authenticated wallet.");
  if (!transaction.to || normalizeAddress(transaction.to) !== normalizeAddress(onchain.pool))
    throw new Error("Transaction destination is not the selected market pool.");
  const decoded = decodeTradeReceipt(receipt, onchain.pool, input.walletAddress);
  if (!decoded.orderId || !decoded.side || decoded.filledQuantity <= 0n)
    throw new Error("The receipt has no verified filled DreamDEX order for this wallet.");
  const position = await exchange.client.getOutcomeBalance({
    outcomeToken: onchain.outcomeToken,
    account: input.walletAddress,
    id: decoded.side === "UP" ? onchain.yesId : onchain.noId,
  });
  const verifiedAt = new Date().toISOString();
  const result: VerifiedRoomTrade = {
    transactionHash: input.transactionHash,
    blockNumber: receipt.blockNumber.toString(),
    marketId: marketIdResult.data,
    walletAddress: normalizeAddress(input.walletAddress),
    side: decoded.side,
    requestedQuantity: formatUnits(decoded.requestedQuantity, onchain.decimals),
    filledQuantity: formatUnits(decoded.filledQuantity, onchain.decimals),
    executionPrice:
      decoded.executionPrice === null
        ? null
        : formatUnits(decoded.executionPrice, onchain.decimals),
    receiptStatus: "SUCCESS",
    positionVerification: "VERIFIED",
    currentPositionBalance: formatUnits(position, onchain.decimals),
    verifiedAt,
  };
  const { error: insertError } = await client.from("verified_trades").insert({
    room_id: room.id,
    transaction_hash: result.transactionHash,
    wallet_address: result.walletAddress,
    chain_id: 50312,
    market_id: result.marketId,
    side: result.side,
    requested_quantity: result.requestedQuantity,
    filled_quantity: result.filledQuantity,
    execution_price: result.executionPrice,
    block_number: result.blockNumber,
    receipt_status: "SUCCESS",
    verification_status: "verified",
    verified_at: verifiedAt,
  });
  if (insertError)
    throw new Error("This transaction could not be recorded as a verified room trade.");
  return result;
}
