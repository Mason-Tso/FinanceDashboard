import { CongressTable } from "@/components/CongressTable";
import { StockSearch } from "@/components/StockSearch";
import { Card, SectionTitle, SourceTag } from "@/components/primitives";
import { getCongressTrades } from "@/lib/quiver";

export const dynamic = "force-dynamic";

export default async function InsidersPage() {
  const congress = await getCongressTrades().catch(() => ({ data: [], source: "mock" as const }));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insiders &amp; Congress</h1>
          <p className="mt-0.5 text-sm text-muted">Who&apos;s buying and selling — corporate insiders and members of Congress.</p>
        </div>
        <StockSearch />
      </div>

      <Card className="p-5">
        <SectionTitle right={<SourceTag source={congress.source} />}>Recent congressional trades</SectionTitle>
        <CongressTable trades={congress.data} />
      </Card>

      <Card className="p-5">
        <p className="text-sm text-muted">
          Looking for a specific company&apos;s insider filings? Search a ticker above — the{" "}
          <span className="text-fg">Insider activity</span> panel on each stock page lists recent buys and sells.
        </p>
      </Card>
    </div>
  );
}
