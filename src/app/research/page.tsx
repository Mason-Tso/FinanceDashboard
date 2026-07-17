import Link from "next/link";
import { StockSearch } from "@/components/StockSearch";
import { Card } from "@/components/primitives";

const POPULAR = ["AAPL", "NVDA", "MSFT", "TSLA", "AMD", "GOOGL", "AMZN", "META", "SPY", "QQQ"];

export default function ResearchPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Research a stock</h1>
        <p className="mt-1 text-sm text-muted">
          Type a ticker for a plain-English breakdown — signal, news, fundamentals, and insider activity.
        </p>
      </div>

      <div className="w-full">
        <StockSearch autoFocus />
      </div>

      <Card className="w-full p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">Popular</div>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((s) => (
            <Link
              key={s}
              href={`/stock/${s}`}
              className="tnum rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg transition hover:border-accent/60 hover:text-accent"
            >
              {s}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
