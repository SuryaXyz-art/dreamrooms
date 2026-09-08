import { PageHeading, PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { DataSourceBadge, StatusBadge } from "@/components/ui/status-badge";
import { messages } from "@/lib/i18n/messages";
import { createMarketProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const health = await createMarketProvider().getHealth();
  return (
    <PageLayout>
      <PageHeading
        eyebrow="Observability"
        title={messages.en.status.title}
        body={messages.en.status.body}
        action={<DataSourceBadge source={health.source} />}
      />
      <div className="grid gap-3">
        {health.checks.map((check) => (
          <Card key={check.name}>
            <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">{check.name}</h2>
                <p className="mt-1 text-sm text-muted">{check.detail}</p>
              </div>
              <div className="flex items-center gap-2">
                <DataSourceBadge source={check.source} />
                <StatusBadge status={check.state} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 border-warning/30 bg-warning/5">
        <CardContent>
          <p className="text-sm leading-6 text-warning">
            <strong>Safety note:</strong> live rows are discoverable, and wallet signing remains
            manual. Every order is gated by fresh on-chain status and receipt verification.
          </p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
