import { PageHeading, PageLayout } from "@/components/page-layout";
import { DataSourceBadge } from "@/components/ui/status-badge";
import { createPortfolioProvider } from "@/lib/providers";
import { messages } from "@/lib/i18n/messages";
import { ClaimPanel } from "@/components/claim-panel";
import { PortfolioPositions } from "@/components/portfolio-positions";

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
      <PortfolioPositions />
      <section className="mt-8" aria-label="Finalized claims">
        <ClaimPanel />
      </section>
    </PageLayout>
  );
}
