/** Shared domain types used across the API layer and the UI. */

export type Signal = "buy" | "hold" | "sell";

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayLow?: number;
  dayHigh?: number;
  yearLow?: number;
  yearHigh?: number;
  marketCap?: number;
  volume?: number;
  pe?: number;
}

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  averageBuyPrice: number;
  price: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  /** Fraction of the total portfolio (0–1). */
  weight: number;
}

export interface Portfolio {
  totalValue: number;
  cash: number;
  totalCostBasis: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPercent: number;
  positions: Position[];
  /** Present when values are illustrative rather than from a live brokerage. */
  isMock?: boolean;
  /** SnapTrade account name/number, when connected. */
  accountName?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
  symbols?: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

export interface InsiderTrade {
  symbol: string;
  insiderName: string;
  relationship?: string;
  transaction: "buy" | "sell";
  shares: number;
  price?: number;
  value?: number;
  filedAt: string; // ISO
}

export interface CongressTrade {
  symbol: string;
  representative: string;
  chamber: "house" | "senate";
  transaction: "buy" | "sell" | "exchange";
  amountRange: string;
  tradedAt: string; // ISO
  filedAt?: string; // ISO
}

/** Structured, plain-English analysis for a single ticker. */
export interface StockAnalysis {
  symbol: string;
  signal: Signal;
  /** 0–100. */
  confidence: number;
  /** One-paragraph plain-English summary. */
  summary: string;
  /** Which way it's leaning and why, in short bullets. */
  leaning: string;
  bullish: string[];
  bearish: string[];
  risks: string[];
  /** How the analysis was produced, for transparency. */
  engine: "rules" | "anthropic" | "openai";
  /** Always shown in the UI. */
  disclaimer: string;
}
