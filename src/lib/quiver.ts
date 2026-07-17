/**
 * Quiver Quantitative client — congressional trading (+ optional corporate
 * insider trades, which require a higher Quiver tier).
 *
 * Server-only. Endpoints and auth verified against the live API:
 *   - /beta/live/congresstrading                → all recent congress trades
 *   - /beta/historical/congresstrading/{ticker} → per-ticker congress trades
 *   - /beta/live/insiders                        → SEC insiders (premium tier)
 * Auth: `Authorization: Bearer <key>`.
 */

import "server-only";
import { env } from "./env";
import { mockCongressTrades, mockInsiderTrades } from "./mock";
import type { CongressTrade, InsiderTrade } from "./types";

const BASE = "https://api.quiverquant.com/beta";

export type Sourced<T, S extends string = "quiver" | "mock"> = { data: T; source: S };

class QuiverForbiddenError extends Error {}

async function quiverGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${env.quiver.apiKey!}`, Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (res.status === 403) throw new QuiverForbiddenError(`Quiver ${path}: dataset not in plan`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Quiver ${path} failed: ${res.status} ${body.slice(0, 120)}`);
  }
  return (await res.json()) as T;
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(String(v).replace(/[$,]/g, "")) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function mapTransaction(t: string): "buy" | "sell" | "exchange" {
  const s = t.toLowerCase();
  if (s.includes("sale") || s.includes("sell")) return "sell";
  if (s.includes("exch")) return "exchange";
  return "buy";
}

export async function getCongressTrades(symbol?: string, limit = 50): Promise<Sourced<CongressTrade[]>> {
  if (!env.quiver.isConfigured) return { data: mockCongressTrades(symbol), source: "mock" };

  const path = symbol
    ? `/historical/congresstrading/${symbol.toUpperCase()}`
    : `/live/congresstrading`;
  const rows = await quiverGet<Record<string, unknown>[]>(path);
  const data: CongressTrade[] = (rows ?? []).slice(0, limit).map((r) => {
    const house = String(r.House ?? "").toLowerCase();
    return {
      symbol: String(r.Ticker ?? symbol ?? "").toUpperCase(),
      representative: String(r.Representative ?? r.Senator ?? "Unknown"),
      chamber: house.includes("sen") ? "senate" : "house",
      transaction: mapTransaction(String(r.Transaction ?? "")),
      amountRange: String(r.Range ?? r.Amount ?? "Undisclosed"),
      tradedAt: new Date(String(r.TransactionDate ?? r.Date ?? Date.now())).toISOString(),
      filedAt: r.ReportDate ? new Date(String(r.ReportDate)).toISOString() : undefined,
    };
  });
  return { data, source: "quiver" };
}

/**
 * Corporate SEC insider trades. Returns source "unavailable" (not mock) when the
 * account's Quiver plan doesn't include the dataset, so the UI can be honest.
 */
export async function getInsiderTrades(
  symbol: string,
): Promise<Sourced<InsiderTrade[], "quiver" | "mock" | "unavailable">> {
  const sym = symbol.toUpperCase();
  if (!env.quiver.isConfigured) return { data: mockInsiderTrades(sym), source: "mock" };

  try {
    const rows = await quiverGet<Record<string, unknown>[]>(`/live/insiders?ticker=${sym}`);
    const data: InsiderTrade[] = (rows ?? [])
      .filter((r) => String(r.Ticker ?? "").toUpperCase() === sym)
      .map((r) => {
        const shares = num(r.Shares ?? r.shares);
        return {
          symbol: sym,
          insiderName: String(r.Name ?? "Unknown"),
          relationship: (r.Title ?? undefined) as string | undefined,
          transaction: shares >= 0 ? "buy" : "sell",
          shares: Math.abs(shares),
          price: r.PricePerShare != null ? num(r.PricePerShare) : undefined,
          value: r.Value != null ? Math.abs(num(r.Value)) : undefined,
          filedAt: new Date(String(r.Date ?? Date.now())).toISOString(),
        };
      });
    return { data, source: "quiver" };
  } catch (e) {
    if (e instanceof QuiverForbiddenError) return { data: [], source: "unavailable" };
    throw e;
  }
}
