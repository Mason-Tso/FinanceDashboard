/**
 * Deterministic mock data. Used as a fallback whenever a data source isn't
 * configured yet, so the dashboard is fully runnable out of the box. Every
 * mock payload is flagged (`isMock`/`source: "mock"`) so the UI can badge it.
 */

import type {
  CongressTrade,
  InsiderTrade,
  NewsItem,
  Portfolio,
  Position,
  Quote,
} from "./types";

/** Small stable pseudo-random from a string, so mocks don't jitter per render. */
function seeded(sym: string): number {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) % 100000;
  return h / 100000;
}

export function mockQuote(symbol: string): Quote {
  const s = symbol.toUpperCase();
  const base = 40 + seeded(s) * 400;
  const changePercent = (seeded(s + "c") - 0.5) * 6;
  const change = (base * changePercent) / 100;
  return {
    symbol: s,
    name: `${s} (mock)`,
    price: round(base),
    change: round(change),
    changePercent: round(changePercent),
    dayLow: round(base * 0.98),
    dayHigh: round(base * 1.02),
    yearLow: round(base * 0.7),
    yearHigh: round(base * 1.35),
    marketCap: Math.round(base * 1e9),
    volume: Math.round(1e6 + seeded(s + "v") * 5e7),
    pe: round(12 + seeded(s + "p") * 30),
  };
}

const MOCK_HOLDINGS: Array<[string, string, number, number]> = [
  ["AAPL", "Apple Inc.", 25, 165.4],
  ["NVDA", "NVIDIA Corp.", 12, 480.1],
  ["MSFT", "Microsoft Corp.", 10, 330.2],
  ["TSLA", "Tesla Inc.", 15, 240.7],
  ["AMD", "Advanced Micro Devices", 30, 110.5],
];

export function mockPortfolio(): Portfolio {
  const cash = 4210.55;
  const positions: Position[] = MOCK_HOLDINGS.map(([symbol, name, qty, avg]) => {
    const price = mockQuote(symbol).price;
    const marketValue = round(price * qty);
    const costBasis = round(avg * qty);
    const unrealizedPnl = round(marketValue - costBasis);
    return {
      symbol,
      name,
      quantity: qty,
      averageBuyPrice: avg,
      price,
      marketValue,
      costBasis,
      unrealizedPnl,
      unrealizedPnlPercent: round((unrealizedPnl / costBasis) * 100),
      weight: 0, // filled in below
    };
  });
  const investable = positions.reduce((a, p) => a + p.marketValue, 0);
  const totalValue = round(investable + cash);
  for (const p of positions) p.weight = round(p.marketValue / totalValue, 4);
  const totalCostBasis = round(positions.reduce((a, p) => a + p.costBasis, 0));
  const totalUnrealizedPnl = round(investable - totalCostBasis);
  return {
    totalValue,
    cash,
    totalCostBasis,
    totalUnrealizedPnl,
    totalUnrealizedPnlPercent: round((totalUnrealizedPnl / totalCostBasis) * 100),
    positions: positions.sort((a, b) => b.marketValue - a.marketValue),
    isMock: true,
    accountName: "Mock brokerage account",
  };
}

export function mockNews(symbol?: string): NewsItem[] {
  const tag = symbol ? symbol.toUpperCase() : "MARKET";
  const templates = [
    ["Fed signals patience on rate path as inflation cools", "negative"],
    [`${tag}: analysts raise price targets after strong guidance`, "positive"],
    ["Tech megacaps lead broad rally into earnings week", "positive"],
    ["Oil slips as demand outlook softens", "neutral"],
    [`Options activity spikes around ${tag} ahead of report`, "neutral"],
  ] as const;
  return templates.map((t, i) => ({
    id: `mock-${tag}-${i}`,
    title: t[0],
    summary: "Illustrative mock headline — connect FMP/hydromancer for live news.",
    url: "https://example.com",
    source: "mock",
    publishedAt: new Date(Date.now() - i * 3600_000).toISOString(),
    symbols: symbol ? [tag] : undefined,
    sentiment: t[1],
  }));
}

export function mockInsiderTrades(symbol: string): InsiderTrade[] {
  const s = symbol.toUpperCase();
  return [
    {
      symbol: s,
      insiderName: "Jane Officer (mock)",
      relationship: "CFO",
      transaction: "buy",
      shares: 5000,
      price: mockQuote(s).price,
      value: round(mockQuote(s).price * 5000),
      filedAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
    },
    {
      symbol: s,
      insiderName: "John Director (mock)",
      relationship: "Director",
      transaction: "sell",
      shares: 1200,
      price: mockQuote(s).price,
      value: round(mockQuote(s).price * 1200),
      filedAt: new Date(Date.now() - 9 * 86400_000).toISOString(),
    },
  ];
}

export function mockCongressTrades(symbol?: string): CongressTrade[] {
  const s = (symbol ?? "NVDA").toUpperCase();
  return [
    {
      symbol: s,
      representative: "Rep. A. Sample (mock)",
      chamber: "house",
      transaction: "buy",
      amountRange: "$15,001 - $50,000",
      tradedAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
      filedAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
    },
  ];
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
