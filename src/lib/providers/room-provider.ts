import { demoRoom } from "@/lib/demo/fixtures";
import type { Room } from "@/lib/domain/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMarketProvider } from "@/lib/providers/market-provider";

export interface RoomProvider {
  getRoom(roomId: string): Promise<Room | null>;
  listRooms(): Promise<Room[]>;
}

class DevelopmentRoomProvider implements RoomProvider {
  async getRoom(roomId: string): Promise<Room | null> {
    return roomId === demoRoom.id ? demoRoom : null;
  }

  async listRooms(): Promise<Room[]> {
    return [demoRoom];
  }
}

class SupabaseRoomProvider implements RoomProvider {
  private async hydrate(row: Record<string, unknown>): Promise<Room | null> {
    const marketId = typeof row.market_id === "string" ? row.market_id : null;
    if (!marketId) return null;
    const discovery = await createMarketProvider().discoverLiveMarkets();
    const market = discovery.markets.find(
      (candidate) => candidate.id.toLowerCase() === marketId.toLowerCase(),
    );
    if (!market) return null;
    const client = createSupabaseServerClient();
    const roomUuid = typeof row.id === "string" ? row.id : null;
    const participantCount = roomUuid
      ? ((
          await client
            .from("room_participants")
            .select("id", { count: "exact", head: true })
            .eq("room_id", roomUuid)
        ).count ?? 0)
      : 0;
    return {
      id: typeof row.slug === "string" ? row.slug : "",
      title: typeof row.title === "string" ? row.title : "DreamRooms room",
      description: typeof row.thesis === "string" ? row.thesis : "",
      market,
      hostAddress: typeof row.host_wallet === "string" ? row.host_wallet : null,
      participantCount,
      createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
      visibility: "PUBLIC",
      source: "LIVE",
      freshness: "FRESH",
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const { data, error } = await createSupabaseServerClient()
        .from("rooms")
        .select("*")
        .eq("slug", roomId)
        .eq("status", "active")
        .single();
      if (error || !data || new Date(data.market_expires_at).getTime() <= Date.now()) return null;
      return this.hydrate(data as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async listRooms(): Promise<Room[]> {
    try {
      const { data, error } = await createSupabaseServerClient()
        .from("rooms")
        .select("*")
        .eq("status", "active")
        .gt("market_expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(20);
      if (error || !data) return [];
      return (
        await Promise.all(data.map((row) => this.hydrate(row as Record<string, unknown>)))
      ).filter((room): room is Room => room !== null);
    } catch {
      return [];
    }
  }
}

class UnavailableRoomProvider implements RoomProvider {
  async getRoom(): Promise<Room | null> {
    return null;
  }

  async listRooms(): Promise<Room[]> {
    return [];
  }
}

export function createRoomProvider(): RoomProvider {
  if (process.env.DREAMROOMS_DATA_MODE === "demo") return new DevelopmentRoomProvider();
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SECRET_KEY
  )
    return new SupabaseRoomProvider();
  return new UnavailableRoomProvider();
}
