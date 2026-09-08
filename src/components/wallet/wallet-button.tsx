"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { SOMNIA_SHANNON_CHAIN_ID } from "@/lib/dreamdex/config";
import { formatCompactAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export function WalletButton({ alwaysVisible = false }: { alwaysVisible?: boolean }) {
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const connector = connectors[0];

  if (!isConnected || !address) {
    return (
      <Button
        className={alwaysVisible ? "inline-flex" : "hidden sm:inline-flex"}
        disabled={!connector || isConnecting}
        onClick={() => connector && connect({ connector })}
        variant="secondary"
      >
        {isConnecting ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  if (chainId !== SOMNIA_SHANNON_CHAIN_ID) {
    return (
      <Button
        className={alwaysVisible ? "inline-flex" : "hidden sm:inline-flex"}
        disabled={isSwitching}
        onClick={() => switchChain({ chainId: SOMNIA_SHANNON_CHAIN_ID })}
        variant="danger"
      >
        {isSwitching ? "Switching…" : "Switch to Shannon"}
      </Button>
    );
  }

  return (
    <div
      className={alwaysVisible ? "flex items-center gap-2" : "hidden items-center gap-2 sm:flex"}
    >
      <StatusBadge status="Shannon ready" />
      <Button aria-label="Disconnect wallet" onClick={() => disconnect()} variant="secondary">
        {formatCompactAddress(address)}
      </Button>
    </div>
  );
}
