"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { SOMNIA_SHANNON_CHAIN_ID } from "@/lib/dreamdex/config";
import { formatCompactAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export function WalletButton({ alwaysVisible = false }: { alwaysVisible?: boolean }) {
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();
  const connector = connectors[0];

  if (!isConnected || !address) {
    return (
      <div className="grid justify-items-end gap-1">
        <Button
          className={alwaysVisible ? "inline-flex" : "hidden sm:inline-flex"}
          disabled={!connector || isConnecting}
          onClick={() => connector && connect({ connector })}
          variant="secondary"
        >
          {isConnecting ? "Connecting…" : connector ? "Connect wallet" : "No browser wallet"}
        </Button>
        {connectError ? (
          <p className="max-w-56 text-right text-xs text-failure" role="alert">
            Connection was not completed. Open DreamRooms in a wallet-enabled browser and retry.
          </p>
        ) : null}
      </div>
    );
  }

  if (chainId !== SOMNIA_SHANNON_CHAIN_ID) {
    return (
      <div className="grid justify-items-end gap-1">
        <Button
          className={alwaysVisible ? "inline-flex" : "hidden sm:inline-flex"}
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: SOMNIA_SHANNON_CHAIN_ID })}
          variant="danger"
        >
          {isSwitching ? "Switching…" : "Switch to Shannon"}
        </Button>
        {switchError ? (
          <p className="max-w-56 text-right text-xs text-failure" role="alert">
            Network switch was not completed. Select Somnia Shannon (50312) in your wallet.
          </p>
        ) : null}
      </div>
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
