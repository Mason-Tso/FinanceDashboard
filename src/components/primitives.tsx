import type { ReactNode } from "react";
import { percent, trendColor } from "@/lib/format";

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <div className={`card ${hover ? "card-hover" : ""} ${className}`}>{children}</div>;
}

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{children}</h2>
      {right}
    </div>
  );
}

/** Signed percentage chip with up/down coloring. */
export function DeltaPill({ value, className = "" }: { value: number | undefined; className?: string }) {
  const up = (value ?? 0) >= 0;
  return (
    <span
      className={`tnum inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
        up ? "bg-up-soft text-up" : "bg-down-soft text-down"
      } ${className}`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {percent(value, { sign: false })}
    </span>
  );
}

export function Trend({ value, children }: { value: number | undefined; children: ReactNode }) {
  return <span className={`tnum ${trendColor(value)}`}>{children}</span>;
}

/** Small tag showing where data came from (live source vs mock). */
export function SourceTag({ source }: { source: string }) {
  const isMock = source === "mock";
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        isMock ? "bg-warn/15 text-warn" : "bg-surface-2 text-faint"
      }`}
      title={isMock ? "Sample data — add the API key to go live" : `Live from ${source}`}
    >
      {isMock ? "sample" : source}
    </span>
  );
}

const SIGNAL_STYLES: Record<string, string> = {
  buy: "bg-up-soft text-up border-up/30",
  hold: "bg-warn/10 text-warn border-warn/30",
  sell: "bg-down-soft text-down border-down/30",
};

export function SignalBadge({ signal, size = "md" }: { signal: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "px-3 py-1 text-sm" : size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-md border font-semibold uppercase tracking-wide ${sz} ${
        SIGNAL_STYLES[signal] ?? "bg-surface-2 text-muted border-line"
      }`}
    >
      {signal}
    </span>
  );
}
