import Link from "next/link";
import { AllocationDonut } from "@/components/AllocationDonut";
import { NewsList } from "@/components/NewsList";
import { PositionsTable } from "@/components/PositionsTable";
import { SectorRadar } from "@/components/SectorRadar";
import { Card, DeltaPill, SectionTitle, SourceTag } from "@/components/primitives";
import { getBatchQuotes, getMarketNews } from "@/lib/fmp";
import { money, percent } from "@/lib/format";
import { predictSectors } from "@/lib/sectors";
import { momentumSignal, type QuickSignal } from "@/lib/signals";
import { getPortfolio } from "@/lib/snaptrade";
import type { Portfolio } from "@/lib/types";

export const dynamic = "force-dynamic";

async function safePortfolio(): Promise<Portfolio> {
  try {
    return await getPortfolio();
  } catch {
    const { mockPortfolio } = await import("@/lib/mock");
    return { ...mockPortfolio(), accountName: "Live fetch failed — showing sample data" };
  }
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-faint">{label}</div>
      <div className="tnum mt-1 text-2xl font-semibold text-fg">{value}</div>
      {sub && <div className="mt-1 text-sm">{sub}</div>}
    </Card>
  );
}

export default async function DashboardPage() {
  const portfolio = await safePortfolio();
  const [news, quotes] = await Promise.all([
    getMarketNews(14).catch(() => ({ data: [], source: "mock" as const })),
    getBatchQuotes(portfolio.positions.map((p) => p.symbol)).catch(() => new Map()),
  ]);

  const signals: Record<string, QuickSignal> = {};
  const counts = { buy: 0, hold: 0, sell: 0 };
  for (const p of portfolio.positions) {
    const q = quotes.get(p.symbol);
    if (q) {
      const s = momentumSignal(q);
      signals[p.symbol] = s;
      counts[s.signal] += 1;
    }
  }
  const sectors = predictSectors(news.data, 5);

  const isSample =
    portfolio.isMock ||
    portfolio.accountName?.toLowerCase().includes("sample") ||
    portfolio.accountName?.toLowerCase().includes("mock");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted">{portfolio.accountName ?? "Your portfolio"}</p>
        </div>
        {isSample && (
          <Link
            href="/settings"
            className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-sm text-fg transition hover:border-accent/70"
          >
            Connect Robinhood →
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Portfolio value" value={money(portfolio.totalValue)} />
        <StatCard
          label="Total return"
          value={money(portfolio.totalUnrealizedPnl, { sign: true })}
          sub={<DeltaPill value={portfolio.totalUnrealizedPnlPercent} />}
        />
        <StatCard label="Cash" value={money(portfolio.cash)} />
        <StatCard
          label="Positions"
          value={String(portfolio.positions.length)}
          sub={<span className="text-xs text-faint">holdings</span>}
        />
      </div>

      {/* Holdings + allocation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle right={<SourceTag source={isSample ? "mock" : "snaptrade"} />}>
            Holdings · buy/hold/sell
          </SectionTitle>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-up-soft px-2 py-1 text-xs font-medium text-up">
              <span className="tnum text-sm font-semibold">{counts.buy}</span> Buy
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-warn/10 px-2 py-1 text-xs font-medium text-warn">
              <span className="tnum text-sm font-semibold">{counts.hold}</span> Hold
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-down-soft px-2 py-1 text-xs font-medium text-down">
              <span className="tnum text-sm font-semibold">{counts.sell}</span> Sell
            </span>
          </div>
          <PositionsTable positions={portfolio.positions} signals={signals} />
          <p className="mt-3 text-xs text-faint">
            Signals are a quick momentum read (price vs its trend). Hover a badge for the why; open a stock for full
            analysis. Educational only — not financial advice.
          </p>
        </Card>

        <Card className="p-5">
          <SectionTitle>Allocation</SectionTitle>
          <AllocationDonut
            slices={portfolio.positions.map((p) => ({ symbol: p.symbol, value: p.marketValue }))}
            cash={portfolio.cash}
          />
          <div className="mt-2 flex flex-col gap-1.5">
            {portfolio.positions.slice(0, 5).map((p) => (
              <div key={p.symbol} className="flex items-center justify-between text-xs">
                <span className="text-muted">{p.symbol}</span>
                <span className="tnum text-faint">{percent(p.weight * 100)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* News + sector radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle right={<SourceTag source={news.source} />}>Market-moving news</SectionTitle>
          <NewsList items={news.data} limit={12} />
        </Card>

        <Card className="p-5">
          <SectionTitle>Sector radar</SectionTitle>
          <p className="mb-3 text-xs text-faint">Where the news flow is pointing — momentum, not a forecast.</p>
          <SectorRadar sectors={sectors} />
        </Card>
      </div>
    </div>
  );
}
