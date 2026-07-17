"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StockSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const sym = value.trim().toUpperCase();
    if (sym) router.push(`/stock/${encodeURIComponent(sym)}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-md">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">⌕</span>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Look up a ticker — e.g. AAPL, NVDA…"
        className="tnum w-full rounded-lg border border-line bg-bg-elev/70 py-2 pl-9 pr-3 text-sm text-fg placeholder:text-faint outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
        aria-label="Search ticker"
      />
    </form>
  );
}
