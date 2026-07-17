/**
 * Quiver Quantitative client — insider trades and congressional trading.
 *
 * Server-only. Falls back to mock data when QUIVER_API_KEY is not set.
 * Endpoint shapes follow https://api.quiverquant.com/docs/ ; field names there
 * have historically shifted, so mapping is defensive.
 */

import "server-only";
import { env } from "./env";
import { mockCongressTrades, mockInsiderTrades } from "./mock";
import type { CongressTrade, InsiderTrade } from "./types";

const BASE = "https://api.quiverquant.com/beta";

export type Sourced<T> = { data: T; source: "quiver" | "mock" };

async function quiverGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${env.quiver.apiKey!}`,
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Quiver ${path} failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

export async function getInsiderTrades(symbol: string): Promise<Sourced<InsiderTrade[]>> {
  const sym = symbol.toUpperCase();
  if (!env.quiver.isConfigured) return { data: mockInsiderTrades(sym), source: "mock" };

  const rows = await quiverGet<Record<string, unknown>[]>(`/historical/insiders/${sym}`);
  const data: InsiderTrade[] = (rows ?? []).map((r) => {
    const shares = num(r.Shares ?? r.shares);
    return {
      symbol: sym,
      insiderName: String(r.Name ?? r.name ?? "Unknown"),
      relationship: (r.Title ?? r.relationship) as string | undefined,
      transaction: num(r.Shares ?? r.shares) >= 0 ? "buy" : "sell",
      shares: Math.abs(shares),
      price: r.PricePerShare != null ? num(r.PricePerShare) : undefined,
      value: r.Value != null ? Math.abs(num(r.Value)) : undefined,
      filedAt: new Date(String(r.Date ?? r.filedAt ?? Date.now())).toISOString(),
    };
  });
  return { data, source: "quiver" };
}

export async function getCongressTrades(symbol?: string): Promise<Sourced<CongressTrade[]>> {
  if (!env.quiver.isConfigured) return { data: mockCongressTrades(symbol), source: "mock" };

  const path = symbol
    ? `/historical/congresstrading/${symbol.toUpperCase()}`
    : `/live/congresstrading`;
  const rows = await quiverGet<Record<string, unknown>[]>(path);
  const data: CongressTrade[] = (rows ?? []).map((r) => {
    const t = String(r.Transaction ?? r.transaction ?? "").toLowerCase();
    return {
      symbol: String(r.Ticker ?? r.ticker ?? symbol ?? "").toUpperCase(),
      representative: String(r.Representative ?? r.Senator ?? r.name ?? "Unknown"),
      chamber: (String(r.Senator ?? "").length > 0 ? "senate" : "house") as "house" | "senate",
      transaction: t.includes("sale") || t.includes("sell") ? "sell" : t.includes("exch") ? "exchange" : "buy",
      amountRange: String(r.Range ?? r.Amount ?? "Unknown"),
      tradedAt: new Date(String(r.TransactionDate ?? r.Traded ?? Date.now())).toISOString(),
      filedAt: r.ReportDate ? new Date(String(r.ReportDate)).toISOString() : undefined,
    };
  });
  return { data, source: "quiver" };
}
