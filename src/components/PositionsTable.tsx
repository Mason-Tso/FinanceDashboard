import Link from "next/link";
import { money, percent } from "@/lib/format";
import type { QuickSignal } from "@/lib/signals";
import type { Position } from "@/lib/types";
import { SignalBadge } from "./primitives";

function signalTitle(s: QuickSignal): string {
  return (
    `${s.signal.toUpperCase()} · ${s.confidence}% confidence (momentum read)\n\n` +
    `In favor:\n• ${s.bullish.join("\n• ")}\n\n` +
    `Watch out:\n• ${s.bearish.join("\n• ")}\n\n` +
    `Open the stock for full fundamentals & news analysis. Not advice.`
  );
}

export function PositionsTable({
  positions,
  signals,
}: {
  positions: Position[];
  signals?: Record<string, QuickSignal>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-line-soft text-left text-xs uppercase tracking-wide text-faint">
            <th className="py-2 pr-3 font-medium">Symbol</th>
            <th className="py-2 px-3 font-medium">Signal</th>
            <th className="py-2 px-3 text-right font-medium">Price</th>
            <th className="py-2 px-3 text-right font-medium">Mkt value</th>
            <th className="py-2 px-3 text-right font-medium">Unrealized P/L</th>
            <th className="py-2 pl-3 text-right font-medium">Weight</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const sig = signals?.[p.symbol];
            return (
              <tr key={p.symbol} className="group border-b border-line-soft/60 last:border-0 hover:bg-surface/60">
                <td className="py-2.5 pr-3">
                  <Link href={`/stock/${p.symbol}`} className="flex flex-col">
                    <span className="font-semibold text-fg group-hover:text-accent">{p.symbol}</span>
                    <span className="max-w-[180px] truncate text-xs text-faint">{p.name}</span>
                  </Link>
                </td>
                <td className="py-2.5 px-3">
                  {sig ? (
                    <span title={signalTitle(sig)} className="cursor-help">
                      <SignalBadge signal={sig.signal} size="sm" />
                    </span>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="tnum py-2.5 px-3 text-right">{money(p.price)}</td>
                <td className="tnum py-2.5 px-3 text-right">{money(p.marketValue)}</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`tnum ${p.unrealizedPnl >= 0 ? "text-up" : "text-down"}`}>
                      {money(p.unrealizedPnl, { sign: true })}
                    </span>
                    <span className={`tnum text-xs ${p.unrealizedPnl >= 0 ? "text-up/70" : "text-down/70"}`}>
                      {percent(p.unrealizedPnlPercent, { sign: true })}
                    </span>
                  </div>
                </td>
                <td className="tnum py-2.5 pl-3 text-right text-muted">{(p.weight * 100).toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
