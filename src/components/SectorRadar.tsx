import type { SectorInsight } from "@/lib/sectors";

const LEAN_STYLE: Record<SectorInsight["lean"], string> = {
  "heating up": "bg-up-soft text-up",
  cooling: "bg-down-soft text-down",
  "in focus": "bg-warn/10 text-warn",
};

export function SectorRadar({ sectors }: { sectors: SectorInsight[] }) {
  if (sectors.length === 0) {
    return <p className="py-6 text-center text-sm text-faint">Not enough news to read sectors right now.</p>;
  }
  const max = Math.max(...sectors.map((s) => s.mentions), 1);

  return (
    <div className="flex flex-col gap-3">
      {sectors.map((s) => (
        <div key={s.name} className="rounded-lg border border-line-soft bg-surface/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                {s.emoji}
              </span>
              <span className="text-sm font-medium text-fg">{s.name}</span>
            </div>
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ${LEAN_STYLE[s.lean]}`}>
              {s.lean === "heating up" ? "▲ heating up" : s.lean === "cooling" ? "▼ cooling" : "• in focus"}
            </span>
          </div>

          {/* Focus bar (share of news attention) */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(s.mentions / max) * 100}%` }} />
          </div>

          <p className="mt-2 line-clamp-1 text-xs text-faint" title={s.drivers.join(" · ")}>
            {s.mentions} recent {s.mentions === 1 ? "headline" : "headlines"} · e.g. “{s.drivers[0]}”
          </p>
        </div>
      ))}
    </div>
  );
}
