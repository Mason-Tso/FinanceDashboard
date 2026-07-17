"use client";

import { useState } from "react";

export function ConnectButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/snaptrade/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start connection");
      // Open SnapTrade's secure portal — Robinhood credentials are entered there, never here.
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={connect}
        disabled={disabled || loading}
        className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Opening SnapTrade…" : "Connect a brokerage"}
      </button>
      {error && <p className="text-sm text-down">{error}</p>}
    </div>
  );
}
