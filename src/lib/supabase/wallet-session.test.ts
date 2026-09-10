import { describe, expect, it } from "vitest";
import { walletAddressesMatch } from "@/lib/supabase/wallet-address";

const addressA = "0x1111111111111111111111111111111111111111";
const addressB = "0x2222222222222222222222222222222222222222";

describe("wallet session/account binding", () => {
  it("rejects a session for address A when the connected wallet is address B", () => {
    expect(walletAddressesMatch(addressA, addressB)).toBe(false);
  });

  it("accepts the same address regardless of checksum casing", () => {
    const checksummed = "0xAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCd";
    expect(walletAddressesMatch(checksummed, checksummed.toLowerCase())).toBe(true);
  });

  it("fails closed for missing or malformed addresses", () => {
    expect(walletAddressesMatch(addressA, null)).toBe(false);
    expect(walletAddressesMatch(addressA, "not-an-address")).toBe(false);
  });
});
