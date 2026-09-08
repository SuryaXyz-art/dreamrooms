import { PageHeading, PageLayout } from "@/components/page-layout";
import { EmptyState } from "@/components/empty-state";
import { DataSourceBadge } from "@/components/ui/status-badge";
import { createPortfolioProvider } from "@/lib/providers";
import { messages } from "@/lib/i18n/messages";
import { ClaimPanel } from "@/components/claim-panel";

export default async function PortfolioPage() {
  const snapshot = await createPortfolioProvider().getSnapshot(null);
  return (
    <PageLayout>
      <PageHeading
        eyebrow="Wallet view"
        title={messages.en.portfolio.title}
        body={messages.en.portfolio.body}
        action={<DataSourceBadge source={snapshot.source} />}
      />
      <EmptyState
        title="Connect a wallet to see your portfolio"
        body={`${messages.en.portfolio.connect} ${snapshot.message}`}
      />
      <section className="mt-8" aria-label="Finalized claims">
        <ClaimPanel />
      </section>
    </PageLayout>
  );
}
