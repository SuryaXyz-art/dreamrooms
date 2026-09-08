import {
  SOMNIA_TESTNET_ADDRESSES,
  SomniaMarkets,
  type SomniaMarketsConfig,
} from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { createPublicClient, http, type PublicClient } from "viem";

export const SOMNIA_SHANNON_CHAIN_ID = somniaShannon.id;
export const DEFAULT_DREAMDEX_INDEXER_URL = "https://dev.smk.somnia.host/v1/graphql";
export const DEFAULT_SOMNIA_RPC_URL = somniaShannon.rpcUrls.default.http[0];
export const DEFAULT_SOMNIA_WS_RPC_URL = somniaShannon.rpcUrls.default.webSocket[0];
export const SOMNIA_SHANNON_EXPLORER_URL = somniaShannon.blockExplorers.default.url;

export class DreamDexConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DreamDexConfigError";
  }
}

export interface DreamDexRuntimeConfig {
  chainId: typeof SOMNIA_SHANNON_CHAIN_ID;
  indexerUrl: string;
  rpcUrl: string;
  wsRpcUrl: string;
  venueId: string | undefined;
  operatorId: number | undefined;
}

export type EnvironmentRecord = Readonly<Record<string, string | undefined>>;

function nonEmptyEnv(name: string, env: EnvironmentRecord = process.env): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function assertTestnetEndpoint(name: string, value: string): void {
  if (/mainnet|5031/i.test(value)) {
    throw new DreamDexConfigError(`${name} must point to Somnia Shannon testnet`);
  }
}

function parseOperatorId(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new DreamDexConfigError(
      "NEXT_PUBLIC_DREAMDEX_OPERATOR_ID must be a non-negative integer",
    );
  }
  return parsed;
}

export function getDreamDexRuntimeConfig(
  env: EnvironmentRecord = process.env,
): DreamDexRuntimeConfig {
  const configuredChainId = nonEmptyEnv("NEXT_PUBLIC_SOMNIA_CHAIN_ID", env);
  if (configuredChainId && configuredChainId !== String(SOMNIA_SHANNON_CHAIN_ID)) {
    throw new DreamDexConfigError("DreamRooms only supports Somnia Shannon chain 50312");
  }

  const rpcUrl = nonEmptyEnv("NEXT_PUBLIC_SOMNIA_RPC_URL", env) ?? DEFAULT_SOMNIA_RPC_URL;
  const wsRpcUrl = nonEmptyEnv("NEXT_PUBLIC_SOMNIA_WS_RPC_URL", env) ?? DEFAULT_SOMNIA_WS_RPC_URL;
  const indexerUrl =
    nonEmptyEnv("NEXT_PUBLIC_DREAMDEX_INDEXER_URL", env) ?? DEFAULT_DREAMDEX_INDEXER_URL;
  assertTestnetEndpoint("NEXT_PUBLIC_SOMNIA_RPC_URL", rpcUrl);
  assertTestnetEndpoint("NEXT_PUBLIC_SOMNIA_WS_RPC_URL", wsRpcUrl);
  assertTestnetEndpoint("NEXT_PUBLIC_DREAMDEX_INDEXER_URL", indexerUrl);

  return {
    chainId: SOMNIA_SHANNON_CHAIN_ID,
    indexerUrl,
    rpcUrl,
    wsRpcUrl,
    venueId: nonEmptyEnv("NEXT_PUBLIC_DREAMDEX_VENUE_ID", env),
    operatorId: parseOperatorId(nonEmptyEnv("NEXT_PUBLIC_DREAMDEX_OPERATOR_ID", env)),
  };
}

export function createDreamDexExchange(signal?: AbortSignal): SomniaMarkets {
  const config = getDreamDexRuntimeConfig();
  const sdkConfig: SomniaMarketsConfig = {
    indexerUrl: config.indexerUrl,
    chain: somniaShannon,
    wsRpcUrl: config.wsRpcUrl,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    ...(signal ? { signal } : {}),
  };
  return new SomniaMarkets(sdkConfig);
}

export function createShannonPublicClient(): PublicClient {
  const config = getDreamDexRuntimeConfig();
  return createPublicClient({ chain: somniaShannon, transport: http(config.rpcUrl) });
}
