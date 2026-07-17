import { timeAgo } from "@/lib/format";
import type { NewsItem } from "@/lib/types";

const SENTIMENT: Record<string, string> = {
  positive: "text-up",
  negative: "text-down",
  neutral: "text-faint",
};

export function NewsList({ items, limit }: { items: NewsItem[]; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items;
  if (shown.length === 0) {
    return <p className="py-6 text-center text-sm text-faint">No headlines right now.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-line-soft/60">
      {shown.map((n) => (
        <li key={n.id}>
          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-1 py-3 transition"
          >
            <div className="flex items-start gap-2">
              {n.sentiment && (
                <span className={`mt-1.5 text-[8px] ${SENTIMENT[n.sentiment]}`} aria-hidden>
                  ●
                </span>
              )}
              <span className="text-sm leading-snug text-fg group-hover:text-accent">{n.title}</span>
            </div>
            <div className="flex items-center gap-2 pl-4 text-xs text-faint">
              <span>{n.source}</span>
              <span>·</span>
              <span>{timeAgo(n.publishedAt)}</span>
              {n.symbols?.slice(0, 3).map((s) => (
                <span key={s} className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
                  {s}
                </span>
              ))}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
