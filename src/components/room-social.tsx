"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WalletButton } from "@/components/wallet/wallet-button";
import { formatCompactAddress } from "@/lib/utils";

interface RoomSnapshot {
  room: { id: string; market_id: string; market_expires_at: string };
  participants: Array<{ wallet_address: string }>;
  sentiment: { up: number; down: number; total: number };
  reactions: Array<{ reaction: string }>;
  verifiedTrades: Array<{
    wallet_address: string;
    side: "UP" | "DOWN";
    filled_quantity: string;
    execution_price: string | null;
    transaction_hash: string;
    verified_at: string;
  }>;
}

async function jsonResponse(response: Response): Promise<Record<string, unknown>> {
  const value: unknown = await response.json();
  if (!response.ok || typeof value !== "object" || value === null)
    throw new Error("Room service unavailable.");
  return value as Record<string, unknown>;
}

export function RoomSocial({ slug }: { slug: string }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const [authenticated, setAuthenticated] = useState(false);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tradeHash, setTradeHash] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${slug}`, { cache: "no-store" });
      const value = await jsonResponse(response);
      setSnapshot(value as unknown as RoomSnapshot);
    } catch {
      setMessage("Live room state is unavailable. Retry shortly.");
    }
  }, [slug]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 5_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !snapshot?.room.id) return;
    const channel = supabase
      .channel(`room:${snapshot.room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_sentiments",
          filter: `room_id=eq.${snapshot.room.id}`,
        },
        () => void load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_participants",
          filter: `room_id=eq.${snapshot.room.id}`,
        },
        () => void load(),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setMessage("Realtime is unavailable; the room is using five-second refresh.");
        }
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, snapshot?.room.id]);

  useEffect(() => {
    if (!joined || !address) return;
    const heartbeat = () =>
      void fetch(`/api/rooms/${slug}/heartbeat`, {
        method: "POST",
        headers: { "x-dreamrooms-wallet": address },
      }).catch(() => undefined);
    heartbeat();
    const timer = window.setInterval(heartbeat, 30_000);
    return () => window.clearInterval(timer);
  }, [address, joined, slug]);

  async function authenticate(
    action: "room_join" | "room_sentiment" | "room_reaction" | "room_trade_verify",
  ) {
    if (!address) throw new Error("Connect a wallet first.");
    const nonceResponse = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, action }),
    });
    const nonce = await jsonResponse(nonceResponse);
    const signature = await signMessageAsync({ message: String(nonce.message) });
    const verifyResponse = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        address,
        nonce: nonce.nonce,
        signature,
        action,
        message: nonce.message,
      }),
    });
    await jsonResponse(verifyResponse);
    setAuthenticated(true);
  }

  async function mutate(
    path: string,
    body: Record<string, unknown>,
    action: "room_join" | "room_sentiment" | "room_reaction" | "room_trade_verify",
  ) {
    if (!isConnected || !address) {
      setMessage("Connect your Shannon wallet first.");
      return;
    }
    setIsBusy(true);
    setMessage(null);
    try {
      if (!authenticated) await authenticate(action);
      const response = await fetch(`/api/rooms/${slug}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-dreamrooms-wallet": address },
        body: JSON.stringify(body),
      });
      await jsonResponse(response);
      if (path === "join") setJoined(true);
      setMessage("Room state updated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The room action failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function toggleReaction(reaction: string) {
    if (!isConnected || !address) {
      setMessage("Connect your Shannon wallet first.");
      return;
    }
    setIsBusy(true);
    setMessage(null);
    try {
      if (!authenticated) await authenticate("room_reaction");
      const isRemoving = activeReaction === reaction;
      const response = await fetch(`/api/rooms/${slug}/reactions`, {
        method: isRemoving ? "DELETE" : "POST",
        headers: { "content-type": "application/json", "x-dreamrooms-wallet": address },
        body: JSON.stringify({ reaction }),
      });
      await jsonResponse(response);
      setActiveReaction(isRemoving ? null : reaction);
      setMessage(isRemoving ? "Reaction removed." : "Reaction added.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The reaction failed.");
    } finally {
      setIsBusy(false);
    }
  }

  const percentages = useMemo(() => {
    const total = snapshot?.sentiment.total ?? 0;
    return {
      up: total ? Math.round(((snapshot?.sentiment.up ?? 0) * 100) / total) : null,
      down: total ? Math.round(((snapshot?.sentiment.down ?? 0) * 100) / total) : null,
    };
  }, [snapshot]);
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]" aria-label="Live room community">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Community pulse</h2>
          <p className="mt-1 text-sm text-muted">
            Sentiment is separate from a wallet-signed DreamDEX trade.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="border-ink bg-ink text-page"
              disabled={isBusy}
              onClick={() => void mutate("sentiment", { side: "UP" }, "room_sentiment")}
            >
              ↑ UP {percentages.up === null ? "—" : `${percentages.up}%`}
            </Button>
            <Button
              className="down-pattern border-ink/40"
              disabled={isBusy}
              onClick={() => void mutate("sentiment", { side: "DOWN" }, "room_sentiment")}
            >
              ↓ DOWN {percentages.down === null ? "—" : `${percentages.down}%`}
            </Button>
          </div>
          <p className="text-sm text-muted">
            {snapshot?.sentiment.total ?? 0} signed sentiment votes ·{" "}
            {snapshot?.participants.length ?? 0} active participants
          </p>
          <div className="flex flex-wrap gap-2" aria-label="Room reactions">
            {["🔥", "👀", "💡", "👏"].map((reaction) => (
              <Button
                key={reaction}
                disabled={isBusy}
                onClick={() => void toggleReaction(reaction)}
                variant="secondary"
                aria-pressed={activeReaction === reaction}
                className={activeReaction === reaction ? "bg-ink text-page" : undefined}
              >
                {reaction}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted">{snapshot?.reactions.length ?? 0} recent reactions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Join and verify</h2>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!isConnected ? (
            <WalletButton alwaysVisible />
          ) : (
            <Button
              disabled={isBusy || isSigning || joined}
              onClick={() => void mutate("join", {}, "room_join")}
            >
              {isSigning
                ? "Awaiting signature…"
                : joined
                  ? "Joined · heartbeat active"
                  : "Join this room"}
            </Button>
          )}
          <label className="grid gap-2 text-sm font-medium" htmlFor="trade-hash">
            Verify a completed DreamDEX order
          </label>
          <Input
            id="trade-hash"
            placeholder="0x transaction hash"
            value={tradeHash}
            onChange={(event) => setTradeHash(event.target.value)}
          />
          <Button
            disabled={isBusy || tradeHash.length !== 66}
            onClick={() =>
              void mutate("verify-trade", { transactionHash: tradeHash }, "room_trade_verify")
            }
            variant="secondary"
          >
            Verify transaction
          </Button>
          {message ? (
            <p className="text-sm text-muted" role="status">
              {message}
            </p>
          ) : null}
          <p className="text-xs leading-5 text-muted">
            A verified activity row requires the receipt, sender, selected market pool and
            outcome-token position to agree on Shannon.
          </p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <h2 className="text-lg font-semibold">Verified activity</h2>
        </CardHeader>
        <CardContent>
          {snapshot?.verifiedTrades.length ? (
            <ul className="grid gap-3">
              {snapshot.verifiedTrades.map((trade) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 text-sm"
                  key={trade.transaction_hash}
                >
                  <span className="font-mono">{formatCompactAddress(trade.wallet_address)}</span>
                  <span>
                    {trade.side} · {trade.filled_quantity} shares
                    {trade.execution_price ? ` · ${trade.execution_price}` : ""}
                  </span>
                  <a
                    className="underline"
                    href={`https://shannon-explorer.somnia.network/tx/${trade.transaction_hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    receipt
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No verified trades in this room yet.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
