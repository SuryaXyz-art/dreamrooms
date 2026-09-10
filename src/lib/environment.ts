import { getDreamDexRuntimeConfig, type EnvironmentRecord } from "@/lib/dreamdex/config";

export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentValidationError";
  }
}

function optionalHttpsUrl(name: string, value: string | undefined, allowLocalhost = false): void {
  if (!value) return;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new EnvironmentValidationError(`${name} must be a valid HTTPS URL.`);
  }
  if (
    parsed.protocol !== "https:" &&
    !(allowLocalhost && parsed.protocol === "http:" && parsed.hostname === "localhost")
  ) {
    throw new EnvironmentValidationError(
      `${name} must use HTTPS${allowLocalhost ? " (or localhost HTTP)" : ""}.`,
    );
  }
}

function optionalHttpsOrWssUrl(name: string, value: string | undefined): void {
  if (!value) return;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new EnvironmentValidationError(`${name} must be a valid HTTPS or WSS URL.`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "wss:") {
    throw new EnvironmentValidationError(`${name} must use HTTPS or WSS.`);
  }
}

export interface SupabaseEnvironment {
  url: string;
  publishableKey: string;
  secretKey: string | undefined;
}

export function validateEnvironment(env: EnvironmentRecord = process.env): {
  dreamDex: ReturnType<typeof getDreamDexRuntimeConfig>;
  supabase: SupabaseEnvironment | null;
} {
  const mode = env.DREAMROOMS_DATA_MODE?.trim() ?? "";
  if (mode !== "" && mode !== "demo") {
    throw new EnvironmentValidationError("DREAMROOMS_DATA_MODE must be blank or demo.");
  }
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  const secretKey = env.SUPABASE_SECRET_KEY?.trim() || undefined;
  const sessionSecret = env.DREAMROOMS_SESSION_SECRET?.trim() || undefined;
  const hasSupabase = Boolean(supabaseUrl || publishableKey || secretKey);
  if (hasSupabase && (!supabaseUrl || !publishableKey)) {
    throw new EnvironmentValidationError(
      "Supabase URL and publishable key are required together; the server secret is optional until server writes are enabled.",
    );
  }
  if (sessionSecret && sessionSecret.length < 32) {
    throw new EnvironmentValidationError(
      "DREAMROOMS_SESSION_SECRET must be at least 32 characters.",
    );
  }
  optionalHttpsUrl(
    "NEXT_PUBLIC_SOMNIA_RPC_URL",
    env.NEXT_PUBLIC_SOMNIA_RPC_URL?.trim() || undefined,
  );
  optionalHttpsOrWssUrl(
    "NEXT_PUBLIC_SOMNIA_WS_RPC_URL",
    env.NEXT_PUBLIC_SOMNIA_WS_RPC_URL?.trim() || undefined,
  );
  optionalHttpsUrl(
    "NEXT_PUBLIC_DREAMDEX_INDEXER_URL",
    env.NEXT_PUBLIC_DREAMDEX_INDEXER_URL?.trim() || undefined,
  );
  optionalHttpsUrl("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl || undefined);
  optionalHttpsUrl("NEXT_PUBLIC_APP_URL", env.NEXT_PUBLIC_APP_URL?.trim() || undefined, true);
  let dreamDex: ReturnType<typeof getDreamDexRuntimeConfig>;
  try {
    dreamDex = getDreamDexRuntimeConfig(env);
  } catch (error) {
    throw new EnvironmentValidationError(
      error instanceof Error ? error.message : "Invalid DreamDEX environment.",
    );
  }
  return {
    dreamDex,
    supabase: hasSupabase ? { url: supabaseUrl, publishableKey, secretKey } : null,
  };
}

export function getServerSupabaseEnvironment(
  env: EnvironmentRecord = process.env,
): SupabaseEnvironment {
  const result = validateEnvironment(env).supabase;
  if (!result) {
    throw new EnvironmentValidationError(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before enabling room persistence.",
    );
  }
  return result;
}
