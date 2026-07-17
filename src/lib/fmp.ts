/**
 * Financial Modeling Prep client (market data, fundamentals, news).
 *
 * Server-only. Falls back to mock data when FMP_API_KEY is not set so the app
 * is runnable immediately. All returned payloads carry a `source` marker.
 */

import "server-only";
import { env } from "./env";
import { mockNews, mockQuote } from "./mock";
import type { NewsItem, Quote } from "./types";

const BASE = "https://financialmodelingprep.com/api/v3";

export type Sourced<T> = { data: T; source: "fmp" | "mock" };

async function fmpGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", env.fmp.apiKey!);

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FMP ${path} failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

interface FmpQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  marketCap: number;
  volume: number;
  pe: number;
}

export async function getQuote(symbol: string): Promise<Sourced<Quote>> {
  const sym = symbol.toUpperCase();
  if (!env.fmp.isConfigured) return { data: mockQuote(sym), source: "mock" };

  const rows = await fmpGet<FmpQuote[]>(`/quote/${sym}`);
  const q = rows?.[0];
  if (!q) throw new Error(`No quote returned for ${sym}`);
  return {
    source: "fmp",
    data: {
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changesPercentage,
      dayLow: q.dayLow,
      dayHigh: q.dayHigh,
      yearLow: q.yearLow,
      yearHigh: q.yearHigh,
      marketCap: q.marketCap,
      volume: q.volume,
      pe: q.pe,
    },
  };
}

interface FmpNews {
  symbol?: string;
  publishedDate: string;
  title: string;
  image?: string;
  site: string;
  text: string;
  url: string;
}

function mapNews(rows: FmpNews[]): NewsItem[] {
  return (rows ?? []).map((n, i) => ({
    id: `fmp-${n.url}-${i}`,
    title: n.title,
    summary: n.text?.slice(0, 240),
    url: n.url,
    source: n.site,
    publishedAt: new Date(n.publishedDate).toISOString(),
    symbols: n.symbol ? [n.symbol] : undefined,
  }));
}

/** News for a specific ticker. */
export async function getStockNews(symbol: string, limit = 20): Promise<Sourced<NewsItem[]>> {
  const sym = symbol.toUpperCase();
  if (!env.fmp.isConfigured) return { data: mockNews(sym), source: "mock" };
  const rows = await fmpGet<FmpNews[]>(`/stock_news`, { tickers: sym, limit: String(limit) });
  return { data: mapNews(rows), source: "fmp" };
}

/** General market-moving news across large caps. */
export async function getMarketNews(limit = 30): Promise<Sourced<NewsItem[]>> {
  if (!env.fmp.isConfigured) return { data: mockNews(), source: "mock" };
  const rows = await fmpGet<FmpNews[]>(`/stock_news`, { limit: String(limit) });
  return { data: mapNews(rows), source: "fmp" };
}

export interface KeyMetrics {
  peTtm?: number;
  pbTtm?: number;
  debtToEquityTtm?: number;
  roeTtm?: number;
  currentRatioTtm?: number;
  dividendYieldTtm?: number;
  netProfitMarginTtm?: number;
}

/** Trailing-twelve-month ratios used to seed the rules-based signal. */
export async function getKeyMetrics(symbol: string): Promise<Sourced<KeyMetrics>> {
  const sym = symbol.toUpperCase();
  if (!env.fmp.isConfigured) {
    return {
      source: "mock",
      data: { peTtm: 22, pbTtm: 4, debtToEquityTtm: 0.6, roeTtm: 0.25, currentRatioTtm: 1.4, netProfitMarginTtm: 0.2 },
    };
  }
  const rows = await fmpGet<Record<string, number>[]>(`/ratios-ttm/${sym}`);
  const r = rows?.[0] ?? {};
  return {
    source: "fmp",
    data: {
      peTtm: r.peRatioTTM,
      pbTtm: r.priceToBookRatioTTM,
      debtToEquityTtm: r.debtEquityRatioTTM,
      roeTtm: r.returnOnEquityTTM,
      currentRatioTtm: r.currentRatioTTM,
      dividendYieldTtm: r.dividendYieldTTM,
      netProfitMarginTtm: r.netProfitMarginTTM,
    },
  };
}
