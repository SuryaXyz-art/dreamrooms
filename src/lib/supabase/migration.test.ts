import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260909000100_create_dreamrooms_social.sql",
);

describe("DreamRooms social migration", () => {
  it("is additive and enables RLS for every social table", () => {
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();
    expect(sql).not.toMatch(/\bdrop\s+(table|policy|trigger|function|schema)\b/);
    for (const table of [
      "rooms",
      "room_participants",
      "room_sentiments",
      "verified_trades",
      "room_reactions",
      "wallet_nonces",
    ]) {
      expect(sql).toContain(`create table if not exists public.${table}`);
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
    expect(sql).toContain("chain_id bigint not null check (chain_id = 50312)");
    expect(sql).toContain("verification_status = 'verified'");
    expect(sql).toContain("revoke all on public.wallet_nonces from anon, authenticated");
  });
});
