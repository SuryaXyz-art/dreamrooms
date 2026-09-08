import Link from "next/link";
import type { Room } from "@/lib/domain/models";
import { Card, CardContent } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/ui/status-badge";
import { LocalizedAction } from "@/components/localized-action";

export function RoomPreview({ room }: { room: Room }) {
  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <DataSourceBadge source={room.source} />
            <h3 className="mt-3 text-lg font-semibold">{room.title}</h3>
            <p className="mt-1 text-sm text-muted">{room.description}</p>
          </div>
          <span className="text-sm text-muted">{room.participantCount} in room</span>
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm text-muted">
            {room.market.asset} · {room.market.strike}
          </span>
          <Link
            className="rounded-lg px-2 py-2 text-sm font-semibold text-brand hover:bg-panel-strong"
            href={`/rooms/${room.id}`}
          >
            <LocalizedAction action="viewRoom" /> →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
