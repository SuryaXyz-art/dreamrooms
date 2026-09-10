"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import type { Market } from "@/lib/domain/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { WalletButton } from "@/components/wallet/wallet-button";

export function RoomCreationForm({
  markets,
  selectedMarketId,
}: {
  markets: Market[];
  selectedMarketId: string | undefined;
}) {
  const { address } = useAccount();
  const { signMessageAsync, isPending } = useSignMessage();
  const [title, setTitle] = useState("");
  const [thesis, setThesis] = useState("");
  const [marketId, setMarketId] = useState(selectedMarketId ?? markets[0]?.id ?? "");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [error, setError] = useState<string | null>(null);
  async function createRoom() {
    if (!address) {
      setError("Connect a wallet first.");
      return;
    }
    setError(null);
    try {
      const nonceResponse = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, action: "room_create" }),
      });
      const nonce = (await nonceResponse.json()) as { message?: string; nonce?: string };
      if (!nonceResponse.ok || !nonce.message || !nonce.nonce)
        throw new Error("Authentication is unavailable.");
      const signature = await signMessageAsync({ message: nonce.message });
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address,
          nonce: nonce.nonce,
          signature,
          action: "room_create",
          message: nonce.message,
        }),
      });
      if (!verifyResponse.ok) throw new Error("Wallet authentication failed.");
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, title, thesis, language }),
      });
      const result = (await response.json()) as { shareUrl?: string; error?: string };
      if (!response.ok || !result.shareUrl)
        throw new Error(result.error ?? "Room could not be created.");
      window.location.assign(result.shareUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Room could not be created.");
    }
  }
  return (
    <Card>
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Room details</p>
        <h2 className="mt-1 text-xl font-semibold">Set the tone</h2>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Field hint="Shown at the top of the shared room." label="Room title">
          <Input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. BTC close: above or below?"
          />
        </Field>
        <Field label="Your thesis">
          <Textarea
            value={thesis}
            onChange={(event) => setThesis(event.target.value)}
            placeholder="What should the room pay attention to?"
          />
        </Field>
        <Field label="Live market">
          <select
            className="min-h-11 rounded-xl border bg-page px-3 text-ink"
            value={marketId}
            onChange={(event) => setMarketId(event.target.value)}
            disabled={!markets.length}
          >
            {markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.asset} · {market.strike} · {market.status}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Room language">
          <select
            className="min-h-11 rounded-xl border bg-page px-3 text-ink"
            value={language}
            onChange={(event) => setLanguage(event.target.value as "en" | "hi")}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </Field>
        {address ? (
          <Button
            disabled={isPending || !title.trim() || !marketId || !markets.length}
            onClick={() => void createRoom()}
          >
            {isPending ? "Awaiting signature…" : "Create shareable room"}
          </Button>
        ) : (
          <WalletButton alwaysVisible />
        )}
        {error ? (
          <p className="text-sm text-failure" role="alert">
            {error}
          </p>
        ) : null}
        <p className="text-xs leading-5 text-muted">
          Room expiry is derived from the selected live market. Every wallet signature remains
          manual.
        </p>
      </CardContent>
    </Card>
  );
}
