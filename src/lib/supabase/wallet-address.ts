import { walletAddressSchema } from "@/lib/supabase/schema";

export function walletAddressesMatch(
  sessionAddress: string | null | undefined,
  connectedAddress: string | null | undefined,
): boolean {
  if (!sessionAddress || !connectedAddress) return false;
  try {
    return (
      walletAddressSchema.parse(sessionAddress).toLowerCase() ===
      walletAddressSchema.parse(connectedAddress).toLowerCase()
    );
  } catch {
    return false;
  }
}
