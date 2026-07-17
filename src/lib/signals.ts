/**
 * Fast, transparent momentum signal for a single holding, computed purely from
 * its quote (price vs 50/200-day averages and 52-week range). Cheap enough to
 * run for every portfolio position from one batch-quote call — no per-stock
 * fundamentals fetch. The deep, fundamentals-based signal lives on the stock
 * page (rules engine / AI). Educational only, not advice.
 */

import type { Quote, Signal } from "./types";

export interface QuickSignal {
  signal: Signal;
  confidence: number;
  bullish: string[];
  bearish: string[];
}

export function momentumSignal(q: Quote): QuickSignal {
  const bullish: string[] = [];
  const bearish: string[] = [];
  let score = 0;

  if (q.priceAvg200) {
    if (q.price > q.priceAvg200) {
      score += 1.2;
      bullish.push("Above its 200-day average — long-term uptrend");
    } else {
      score -= 1.2;
      bearish.push("Below its 200-day average — long-term downtrend");
    }
  }

  if (q.priceAvg50) {
    if (q.price > q.priceAvg50) {
      score += 0.8;
      bullish.push("Above its 50-day average — recent strength");
    } else {
      score -= 0.8;
      bearish.push("Below its 50-day average — recent weakness");
    }
  }

  if (q.priceAvg50 && q.priceAvg200) {
    if (q.priceAvg50 > q.priceAvg200) {
      score += 0.6;
      bullish.push("50-day trending above 200-day (bullish crossover)");
    } else {
      score -= 0.6;
      bearish.push("50-day trending below 200-day (bearish crossover)");
    }
  }

  const pos =
    q.yearLow != null && q.yearHigh != null && q.yearHigh > q.yearLow
      ? (q.price - q.yearLow) / (q.yearHigh - q.yearLow)
      : null;
  if (pos != null) {
    if (pos > 0.85) {
      score += 0.3;
      bullish.push("Near its 52-week high");
      bearish.push("So high it may be stretched / overbought");
    } else if (pos < 0.2) {
      score -= 0.5;
      bearish.push("Near its 52-week low — trend is weak");
    }
  }

  let signal: Signal = "hold";
  if (score >= 1.5) signal = "buy";
  else if (score <= -1.5) signal = "sell";
  const confidence = Math.min(90, 45 + Math.round(Math.abs(score) * 12));

  if (!bullish.length) bullish.push("No clear positive momentum right now");
  if (!bearish.length) bearish.push("No clear negative momentum right now");
  return { signal, confidence, bullish, bearish };
}
