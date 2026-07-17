/** Presentation helpers for money, percentages, and large numbers. */

export function money(n: number | undefined, opts: { sign?: boolean } = {}): string {
  if (n == null || Number.isNaN(n)) return "—";
  const s = n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return opts.sign && n > 0 ? `+${s}` : s;
}

export function percent(n: number | undefined, opts: { sign?: boolean } = {}): string {
  if (n == null || Number.isNaN(n)) return "—";
  const s = `${Math.abs(n).toFixed(2)}%`;
  if (!opts.sign) return n < 0 ? `-${s}` : s;
  return n < 0 ? `-${s}` : `+${s}`;
}

export function compact(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
}

/** Tailwind text-color class for a signed value. */
export function trendColor(n: number | undefined): string {
  if (n == null || n === 0) return "text-muted";
  return n > 0 ? "text-up" : "text-down";
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
