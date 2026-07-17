/**
 * Deterministic, explainable rules engine. Turns a quote + fundamentals into a
 * buy/hold/sell signal with plain-English reasoning. This is the baseline the
 * AI providers (Claude / OpenAI) build on — and the fallback when AI is off.
 *
 * These are simple, transparent heuristics — NOT investment advice.
 */

import type { KeyMetrics } from "./fmp";
import type { Quote, Signal, StockAnalysis } from "./types";

export const DISCLAIMER =
  "Educational analysis generated from public data and simple rules. Not investment advice. " +
  "Do your own research and consider consulting a licensed advisor before trading.";

interface Factor {
  label: string;
  /** -2 (bearish) … +2 (bullish) */
  score: number;
  side: "bull" | "bear" | "risk";
}

function rangePosition(q: Quote): number | undefined {
  if (q.yearLow == null || q.yearHigh == null || q.yearHigh <= q.yearLow) return undefined;
  return (q.price - q.yearLow) / (q.yearHigh - q.yearLow); // 0 = at low, 1 = at high
}

export function rulesAnalysis(quote: Quote, metrics: KeyMetrics): StockAnalysis {
  const factors: Factor[] = [];

  // Valuation (P/E)
  if (metrics.peTtm != null && metrics.peTtm > 0) {
    if (metrics.peTtm < 15) factors.push({ label: `Low P/E (${metrics.peTtm.toFixed(1)}) — inexpensive vs earnings`, score: 1.5, side: "bull" });
    else if (metrics.peTtm > 40) factors.push({ label: `High P/E (${metrics.peTtm.toFixed(1)}) — priced for strong growth`, score: -1.5, side: "bear" });
    else factors.push({ label: `Moderate P/E (${metrics.peTtm.toFixed(1)})`, score: 0.3, side: "bull" });
  }

  // Profitability
  if (metrics.roeTtm != null) {
    if (metrics.roeTtm > 0.2) factors.push({ label: `Strong return on equity (${(metrics.roeTtm * 100).toFixed(0)}%)`, score: 1.2, side: "bull" });
    else if (metrics.roeTtm < 0) factors.push({ label: `Negative return on equity — unprofitable`, score: -1.5, side: "bear" });
  }
  if (metrics.netProfitMarginTtm != null) {
    if (metrics.netProfitMarginTtm > 0.15) factors.push({ label: `Healthy net margin (${(metrics.netProfitMarginTtm * 100).toFixed(0)}%)`, score: 0.8, side: "bull" });
    else if (metrics.netProfitMarginTtm < 0) factors.push({ label: `Negative net margin — losing money`, score: -1, side: "bear" });
  }

  // Balance-sheet risk
  if (metrics.debtToEquityTtm != null && metrics.debtToEquityTtm > 2) {
    factors.push({ label: `High debt-to-equity (${metrics.debtToEquityTtm.toFixed(1)}) — leverage risk`, score: -0.8, side: "risk" });
  }
  if (metrics.currentRatioTtm != null && metrics.currentRatioTtm < 1) {
    factors.push({ label: `Current ratio below 1 — short-term liquidity risk`, score: -0.6, side: "risk" });
  }

  // Momentum / range
  const pos = rangePosition(quote);
  if (pos != null) {
    if (pos > 0.85) {
      factors.push({ label: `Trading near 52-week high — strong momentum`, score: 0.8, side: "bull" });
      factors.push({ label: `Near highs can mean stretched / overbought`, score: -0.4, side: "risk" });
    } else if (pos < 0.15) {
      factors.push({ label: `Near 52-week low — beaten down / potential value`, score: 0.3, side: "bull" });
      factors.push({ label: `Near lows can signal a broken trend`, score: -0.6, side: "bear" });
    }
  }
  if (quote.changePercent > 5) factors.push({ label: `Up sharply today (${quote.changePercent.toFixed(1)}%) — watch for a pullback`, score: -0.2, side: "risk" });

  const total = factors.reduce((a, f) => a + f.score, 0);
  let signal: Signal = "hold";
  if (total >= 2) signal = "buy";
  else if (total <= -2) signal = "sell";

  const confidence = Math.min(95, 45 + Math.round(Math.abs(total) * 12));

  const bullish = factors.filter((f) => f.side === "bull").map((f) => f.label);
  const bearish = factors.filter((f) => f.side === "bear").map((f) => f.label);
  const risks = factors.filter((f) => f.side === "risk").map((f) => f.label);

  const leaning =
    signal === "buy"
      ? "The fundamentals lean constructive — quality and/or valuation outweigh the concerns here."
      : signal === "sell"
        ? "The balance tilts cautious — valuation, profitability, or trend concerns dominate."
        : "It's a mixed picture — roughly balanced positives and negatives, so no strong edge either way.";

  const summary =
    `${quote.name} (${quote.symbol}) trades at ${quote.price.toFixed(2)}, ` +
    `${quote.changePercent >= 0 ? "up" : "down"} ${Math.abs(quote.changePercent).toFixed(2)}% on the day. ` +
    `Weighing ${factors.length} simple factors, the model reads this as a ${signal.toUpperCase()} with ${confidence}% confidence. ` +
    leaning;

  return {
    symbol: quote.symbol,
    signal,
    confidence,
    summary,
    leaning,
    bullish: bullish.length ? bullish : ["No standout positives from the basic metrics available."],
    bearish: bearish.length ? bearish : ["No standout negatives from the basic metrics available."],
    risks: risks.length ? risks : ["General market risk applies to any position."],
    engine: "rules",
    disclaimer: DISCLAIMER,
  };
}
