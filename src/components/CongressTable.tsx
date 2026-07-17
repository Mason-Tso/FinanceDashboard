import Link from "next/link";
import { timeAgo } from "@/lib/format";
import type { CongressTrade } from "@/lib/types";

export function CongressTable({ trades }: { trades: CongressTrade[] }) {
  if (trades.length === 0) {
    return <p className="py-6 text-center text-sm text-faint">No recent congressional trades.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-line-soft text-left text-xs uppercase tracking-wide text-faint">
            <th className="py-2 pr-3 font-medium">Member</th>
            <th className="py-2 px-3 font-medium">Ticker</th>
            <th className="py-2 px-3 font-medium">Action</th>
            <th className="py-2 px-3 font-medium">Amount</th>
            <th className="py-2 pl-3 text-right font-medium">Traded</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={`${t.representative}-${i}`} className="border-b border-line-soft/60 last:border-0 hover:bg-surface/60">
              <td className="py-2.5 pr-3">
                <div className="font-medium text-fg">{t.representative}</div>
                <div className="text-xs capitalize text-faint">{t.chamber}</div>
              </td>
              <td className="py-2.5 px-3">
                <Link href={`/stock/${t.symbol}`} className="tnum font-semibold text-fg hover:text-accent">
                  {t.symbol}
                </Link>
              </td>
              <td className="py-2.5 px-3">
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    t.transaction === "sell" ? "bg-down-soft text-down" : "bg-up-soft text-up"
                  }`}
                >
                  {t.transaction[0].toUpperCase() + t.transaction.slice(1)}
                </span>
              </td>
              <td className="tnum py-2.5 px-3 text-muted">{t.amountRange}</td>
              <td className="py-2.5 pl-3 text-right text-xs text-faint">{timeAgo(t.tradedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
