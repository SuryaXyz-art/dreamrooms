import { describe, expect, it } from "vitest";
import { EnvironmentValidationError, validateEnvironment } from "@/lib/environment";

const base = {
  DREAMROOMS_DATA_MODE: "",
  NEXT_PUBLIC_SOMNIA_CHAIN_ID: "",
  NEXT_PUBLIC_SOMNIA_RPC_URL: "",
  NEXT_PUBLIC_SOMNIA_WS_RPC_URL: "",
  NEXT_PUBLIC_DREAMDEX_INDEXER_URL: "",
  NEXT_PUBLIC_DREAMDEX_VENUE_ID: "",
  NEXT_PUBLIC_DREAMDEX_OPERATOR_ID: "",
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  SUPABASE_SECRET_KEY: "",
};

describe("environment contract", () => {
  it("accepts blank overrides and keeps Supabase optional", () => {
    const result = validateEnvironment(base);
    expect(result.dreamDex.chainId).toBe(50312);
    expect(result.supabase).toBeNull();
  });

  it("accepts explicit Shannon configuration and complete Supabase configuration", () => {
    const result = validateEnvironment({
      ...base,
      NEXT_PUBLIC_SOMNIA_CHAIN_ID: "50312",
      NEXT_PUBLIC_SOMNIA_RPC_URL: "https://rpc.example.test",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-placeholder",
      SUPABASE_SECRET_KEY: "server-placeholder",
    });
    expect(result.supabase?.publishableKey).toBe("publishable-placeholder");
  });

  it.each([
    ["NEXT_PUBLIC_SOMNIA_CHAIN_ID", "1"],
    ["NEXT_PUBLIC_SOMNIA_RPC_URL", "http://insecure.example"],
    ["NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co"],
  ])("rejects invalid %s", (key, value) => {
    const env = { ...base, [key]: value };
    if (key === "NEXT_PUBLIC_SUPABASE_URL") env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";
    expect(() => validateEnvironment(env)).toThrow(EnvironmentValidationError);
  });

  it("rejects unsupported data mode and partial Supabase configuration", () => {
    expect(() => validateEnvironment({ ...base, DREAMROOMS_DATA_MODE: "live" })).toThrow(
      EnvironmentValidationError,
    );
    expect(() =>
      validateEnvironment({ ...base, NEXT_PUBLIC_SUPABASE_URL: "https://x.test" }),
    ).toThrow(EnvironmentValidationError);
  });
});
