import { demoRoom } from "@/lib/demo/fixtures";
import type { Room } from "@/lib/domain/models";

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

class UnavailableRoomProvider implements RoomProvider {
  async getRoom(): Promise<Room | null> {
    return null;
  }

  async listRooms(): Promise<Room[]> {
    return [];
  }
}

export function createRoomProvider(): RoomProvider {
  return process.env.NODE_ENV === "production"
    ? new UnavailableRoomProvider()
    : new DevelopmentRoomProvider();
}
