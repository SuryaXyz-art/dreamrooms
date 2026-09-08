import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

/**
 * Wallet configuration is intentionally Shannon-only. No mainnet transport or
 * connector is registered, so a connected wallet must explicitly switch before
 * the trading boundary becomes available.
 */
export const walletConfig = createConfig({
  chains: [somniaShannon],
  connectors: [injected()],
  transports: {
    [somniaShannon.id]: http(somniaShannon.rpcUrls.default.http[0]),
  },
});
