/** Builds the analyst prompt shared by all LLM providers. */

import type { KeyMetrics } from "../fmp";
import type { NewsItem, Quote, StockAnalysis } from "../types";

export interface AnalysisInput {
  quote: Quote;
  metrics: KeyMetrics;
  news: NewsItem[];
  /** Deterministic baseline the model should sanity-check against. */
  baseline: StockAnalysis;
}

export const SYSTEM_PROMPT =
  "You are a sharp, plain-spoken equity analyst writing for a retail investor. " +
  "Explain things simply, avoid jargon (or define it in-line), and be balanced — always give both sides. " +
  "You are NOT giving personalized financial advice; you are summarizing public data for education. " +
  "You MUST respond with a single JSON object and nothing else — no prose, no markdown fences.";

export function buildUserPrompt(input: AnalysisInput): string {
  const { quote, metrics, news, baseline } = input;
  const m = metrics;
  const metricLines = [
    m.peTtm != null && `P/E (TTM): ${m.peTtm.toFixed(1)}`,
    m.pbTtm != null && `P/B: ${m.pbTtm.toFixed(1)}`,
    m.roeTtm != null && `ROE: ${(m.roeTtm * 100).toFixed(0)}%`,
    m.netProfitMarginTtm != null && `Net margin: ${(m.netProfitMarginTtm * 100).toFixed(0)}%`,
    m.debtToEquityTtm != null && `Debt/Equity: ${m.debtToEquityTtm.toFixed(2)}`,
    m.currentRatioTtm != null && `Current ratio: ${m.currentRatioTtm.toFixed(2)}`,
  ]
    .filter(Boolean)
    .join(", ");

  const headlines = news.slice(0, 8).map((n) => `- ${n.title} (${n.source})`).join("\n") || "None available.";

  return `Analyze ${quote.name} (${quote.symbol}) for a retail investor.

CURRENT DATA
- Price: $${quote.price} (${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}% today)
- 52-week range: $${quote.yearLow ?? "?"} – $${quote.yearHigh ?? "?"}
- Market cap: ${quote.marketCap ? "$" + quote.marketCap.toLocaleString() : "?"}
- Fundamentals: ${metricLines || "limited data"}

RECENT HEADLINES
${headlines}

A simple rules model rates this ${baseline.signal.toUpperCase()} (${baseline.confidence}% confidence). Weigh that but reach your own view.

Respond with ONLY this JSON shape:
{
  "signal": "buy" | "hold" | "sell",
  "confidence": <integer 0-100>,
  "summary": "<2-4 sentences, plain English: what this company is, how it's doing, and what the data + news mean>",
  "leaning": "<1-2 sentences on which way it's leaning and why>",
  "bullish": ["<short point>", ...],
  "bearish": ["<short point>", ...],
  "risks": ["<short point>", ...]
}`;
}
