import { compact, money, timeAgo } from "@/lib/format";
import type { InsiderTrade } from "@/lib/types";

export function InsiderTable({ trades }: { trades: InsiderTrade[] }) {
  if (trades.length === 0) {
    return <p className="py-6 text-center text-sm text-faint">No recent insider filings.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-line-soft text-left text-xs uppercase tracking-wide text-faint">
            <th className="py-2 pr-3 font-medium">Insider</th>
            <th className="py-2 px-3 font-medium">Action</th>
            <th className="py-2 px-3 text-right font-medium">Shares</th>
            <th className="py-2 px-3 text-right font-medium">Value</th>
            <th className="py-2 pl-3 text-right font-medium">Filed</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={`${t.insiderName}-${i}`} className="border-b border-line-soft/60 last:border-0">
              <td className="py-2.5 pr-3">
                <div className="font-medium text-fg">{t.insiderName}</div>
                {t.relationship && <div className="text-xs text-faint">{t.relationship}</div>}
              </td>
              <td className="py-2.5 px-3">
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    t.transaction === "buy" ? "bg-up-soft text-up" : "bg-down-soft text-down"
                  }`}
                >
                  {t.transaction === "buy" ? "Buy" : "Sell"}
                </span>
              </td>
              <td className="tnum py-2.5 px-3 text-right text-muted">{compact(t.shares)}</td>
              <td className="tnum py-2.5 px-3 text-right">{t.value != null ? money(t.value) : "—"}</td>
              <td className="py-2.5 pl-3 text-right text-xs text-faint">{timeAgo(t.filedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
