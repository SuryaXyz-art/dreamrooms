import type { Position, Settlement } from "@/lib/domain/models";

export interface PortfolioSnapshot {
  positions: Position[];
  settlements: Settlement[];
  source: Position["source"];
  message: string;
}

export interface PortfolioProvider {
  getSnapshot(walletAddress: string | null): Promise<PortfolioSnapshot>;
}

class FoundationPortfolioProvider implements PortfolioProvider {
  async getSnapshot(): Promise<PortfolioSnapshot> {
    return {
      positions: [],
      settlements: [],
      source: "UNAVAILABLE",
      message: "Connect a wallet to read positions and finalized claims from Shannon.",
    };
  }
}

export function createPortfolioProvider(): PortfolioProvider {
  return new FoundationPortfolioProvider();
}
