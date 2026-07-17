import type { StockAnalysis } from "@/lib/types";
import { Card, SignalBadge } from "./primitives";

const ENGINE_LABEL: Record<StockAnalysis["engine"], string> = {
  rules: "rules engine",
  "claude-cli": "Claude (Max)",
  anthropic: "Claude AI",
  openai: "GPT AI",
};

function Bullets({ title, items, tone }: { title: string; items: string[]; tone: "up" | "down" | "warn" }) {
  const dot = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-warn";
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-faint">{title}</div>
      <ul className="flex flex-col gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <span className={`mt-1.5 text-[7px] ${dot}`} aria-hidden>
              ●
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalysisCard({ analysis }: { analysis: StockAnalysis }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SignalBadge signal={analysis.signal} size="lg" />
          <div>
            <div className="text-sm font-semibold text-fg">Signal</div>
            <div className="text-xs text-faint">
              {analysis.confidence}% confidence · {ENGINE_LABEL[analysis.engine]}
            </div>
          </div>
        </div>
        {/* Confidence meter */}
        <div className="hidden w-28 sm:block">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${analysis.confidence}%` }} />
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-fg">{analysis.summary}</p>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Bullets title="Bullish" items={analysis.bullish} tone="up" />
        <Bullets title="Bearish" items={analysis.bearish} tone="down" />
        <Bullets title="Risks" items={analysis.risks} tone="warn" />
      </div>

      <p className="mt-5 border-t border-line-soft pt-3 text-xs leading-relaxed text-faint">
        ⚠︎ {analysis.disclaimer}
      </p>
    </Card>
  );
}
