import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="grid justify-items-start gap-3">
        <div
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-xl bg-panel-strong text-xl text-brand"
        >
          ○
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-xl text-sm leading-6 text-muted">{body}</p>
        {action}
      </CardContent>
    </Card>
  );
}
