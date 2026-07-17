"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { money, percent } from "@/lib/format";
import type { QuickSignal } from "@/lib/signals";
import type { Position, Signal } from "@/lib/types";
import { SignalBadge } from "./primitives";

type Filter = "all" | Signal;

const CHIP_TONE: Record<Filter, string> = {
  all: "bg-surface-2 text-muted",
  buy: "bg-up-soft text-up",
  hold: "bg-warn/10 text-warn",
  sell: "bg-down-soft text-down",
};

function FilterChip({
  label,
  n,
  filter,
  active,
  onClick,
}: {
  label: string;
  n: number;
  filter: Filter;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition ${CHIP_TONE[filter]} ${
        active ? "ring-2 ring-accent/60" : "opacity-80 hover:opacity-100"
      }`}
    >
      <span className="tnum text-sm font-semibold">{n}</span> {label}
    </button>
  );
}

/** Signal badge with a styled hover popover rendered via portal (never clipped). */
function SignalCell({ sig }: { sig: QuickSignal }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function show() {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left, y: r.bottom + 6 });
  }

  return (
    <span
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      className="inline-block cursor-help"
    >
      <SignalBadge signal={sig.signal} size="sm" />
      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 60 }}
            className="w-72 rounded-lg border border-line bg-bg-elev p-3 text-xs shadow-xl"
          >
            <div className="mb-2 flex items-center gap-2">
              <SignalBadge signal={sig.signal} size="sm" />
              <span className="text-faint">{sig.confidence}% confidence · momentum read</span>
            </div>
            <div className="mb-1 font-semibold uppercase tracking-wide text-faint">In favor</div>
            <ul className="mb-2 flex flex-col gap-1">
              {sig.bullish.map((b, i) => (
                <li key={i} className="flex gap-1.5 text-muted">
                  <span className="mt-1 text-[6px] text-up">●</span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mb-1 font-semibold uppercase tracking-wide text-faint">Watch out</div>
            <ul className="flex flex-col gap-1">
              {sig.bearish.map((b, i) => (
                <li key={i} className="flex gap-1.5 text-muted">
                  <span className="mt-1 text-[6px] text-down">●</span>
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-line-soft pt-2 text-[11px] text-faint">
              Open the stock for full analysis. Not advice.
            </p>
          </div>,
          document.body,
        )}
    </span>
  );
}

export function HoldingsPanel({
  positions,
  signals,
}: {
  positions: Position[];
  signals: Record<string, QuickSignal>;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = { buy: 0, hold: 0, sell: 0 };
  for (const p of positions) {
    const s = signals[p.symbol];
    if (s) counts[s.signal] += 1;
  }

  const shown = positions.filter((p) => filter === "all" || signals[p.symbol]?.signal === filter);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterChip label="All" n={positions.length} filter="all" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterChip label="Buy" n={counts.buy} filter="buy" active={filter === "buy"} onClick={() => setFilter("buy")} />
        <FilterChip label="Hold" n={counts.hold} filter="hold" active={filter === "hold"} onClick={() => setFilter("hold")} />
        <FilterChip label="Sell" n={counts.sell} filter="sell" active={filter === "sell"} onClick={() => setFilter("sell")} />
      </div>

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
            {shown.map((p) => {
              const sig = signals[p.symbol];
              return (
                <tr key={p.symbol} className="group border-b border-line-soft/60 last:border-0 hover:bg-surface/60">
                  <td className="py-2.5 pr-3">
                    <Link href={`/stock/${p.symbol}`} className="flex flex-col">
                      <span className="font-semibold text-fg group-hover:text-accent">{p.symbol}</span>
                      <span className="max-w-[180px] truncate text-xs text-faint">{p.name}</span>
                    </Link>
                  </td>
                  <td className="py-2.5 px-3">{sig ? <SignalCell sig={sig} /> : <span className="text-faint">—</span>}</td>
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

      {shown.length === 0 && (
        <p className="py-6 text-center text-sm text-faint">No {filter} names in your portfolio right now.</p>
      )}
    </div>
  );
}
