import { AnalysisCard } from "@/components/AnalysisCard";
import { CongressTable } from "@/components/CongressTable";
import { InsiderTable } from "@/components/InsiderTable";
import { NewsList } from "@/components/NewsList";
import { Card, DeltaPill, SectionTitle, SourceTag } from "@/components/primitives";
import { rulesAnalysis } from "@/lib/analysis";
import { getKeyMetrics, getQuote, getStockNews, type KeyMetrics } from "@/lib/fmp";
import { compact, money } from "@/lib/format";
import { mockQuote } from "@/lib/mock";
import { getCongressTrades, getInsiderTrades } from "@/lib/quiver";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft/60 py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="tnum text-sm text-fg">{value}</span>
    </div>
  );
}

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol).toUpperCase();

  const [quoteR, metricsR, newsR, insiderR, congressR] = await Promise.all([
    getQuote(sym).catch(() => ({ data: mockQuote(sym), source: "mock" as const })),
    getKeyMetrics(sym).catch(() => ({ data: {} as KeyMetrics, source: "mock" as const })),
    getStockNews(sym, 10).catch(() => ({ data: [], source: "mock" as const })),
    getInsiderTrades(sym).catch(() => ({ data: [], source: "unavailable" as const })),
    getCongressTrades(sym, 15).catch(() => ({ data: [], source: "mock" as const })),
  ]);

  const quote = quoteR.data;
  const analysis = rulesAnalysis(quote, metricsR.data);
  const rangePct =
    quote.yearLow != null && quote.yearHigh != null && quote.yearHigh > quote.yearLow
      ? ((quote.price - quote.yearLow) / (quote.yearHigh - quote.yearLow)) * 100
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{quote.symbol}</h1>
            <SourceTag source={quoteR.source} />
          </div>
          <p className="mt-0.5 text-sm text-muted">{quote.name}</p>
        </div>
        <div className="text-right">
          <div className="tnum text-3xl font-semibold">{money(quote.price)}</div>
          <div className="mt-1 flex items-center justify-end gap-2">
            <span className={`tnum text-sm ${quote.change >= 0 ? "text-up" : "text-down"}`}>
              {money(quote.change, { sign: true })}
            </span>
            <DeltaPill value={quote.changePercent} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AnalysisCard analysis={analysis} />

          <Card className="p-5">
            <SectionTitle right={<SourceTag source={newsR.source} />}>News &amp; what it means</SectionTitle>
            <NewsList items={newsR.data} limit={8} />
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <SectionTitle right={<SourceTag source={metricsR.source} />}>Key stats</SectionTitle>
            <Stat label="Day range" value={`${money(quote.dayLow)} – ${money(quote.dayHigh)}`} />
            <Stat label="52-week range" value={`${money(quote.yearLow)} – ${money(quote.yearHigh)}`} />
            {rangePct != null && <Stat label="Position in range" value={`${rangePct.toFixed(0)}%`} />}
            <Stat label="Market cap" value={quote.marketCap ? `$${compact(quote.marketCap)}` : "—"} />
            <Stat label="P/E (TTM)" value={metricsR.data.peTtm != null ? metricsR.data.peTtm.toFixed(1) : "—"} />
            <Stat label="Volume" value={compact(quote.volume)} />
          </Card>

          <Card className="p-5">
            <SectionTitle right={<SourceTag source={congressR.source} />}>Congressional trades</SectionTitle>
            <CongressTable trades={congressR.data} />
          </Card>

          <Card className="p-5">
            <SectionTitle
              right={insiderR.source === "unavailable" ? undefined : <SourceTag source={insiderR.source} />}
            >
              Insider activity
            </SectionTitle>
            {insiderR.source === "unavailable" ? (
              <p className="text-sm text-faint">
                SEC corporate-insider data isn&apos;t included in your current Quiver plan. Upgrade Quiver to enable
                this panel — congressional trades above are available now.
              </p>
            ) : (
              <InsiderTable trades={insiderR.data} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
