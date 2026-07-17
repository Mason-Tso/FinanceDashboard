/** Parse an LLM's JSON response into a validated StockAnalysis. */

import { DISCLAIMER } from "../analysis";
import type { Signal, StockAnalysis } from "../types";

/** Extract the first balanced JSON object from arbitrary model text. */
function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter((s) => s.trim().length > 0);
}

/**
 * Parse model output; on any malformation fall back to the rules baseline so a
 * bad LLM response never breaks the page.
 */
export function parseAnalysis(
  raw: string,
  symbol: string,
  engine: "claude-cli" | "anthropic" | "openai",
  fallback: StockAnalysis,
): StockAnalysis {
  const json = extractJson(raw);
  if (!json) return fallback;

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return fallback;
  }

  const signal = (["buy", "hold", "sell"] as const).includes(obj.signal as Signal)
    ? (obj.signal as Signal)
    : fallback.signal;

  const confidenceRaw = Number(obj.confidence);
  const confidence = Number.isFinite(confidenceRaw)
    ? Math.min(100, Math.max(0, Math.round(confidenceRaw)))
    : fallback.confidence;

  const summary = typeof obj.summary === "string" && obj.summary.trim() ? obj.summary.trim() : fallback.summary;
  const leaning = typeof obj.leaning === "string" && obj.leaning.trim() ? obj.leaning.trim() : fallback.leaning;

  const bullish = asStringArray(obj.bullish);
  const bearish = asStringArray(obj.bearish);
  const risks = asStringArray(obj.risks);

  return {
    symbol,
    signal,
    confidence,
    summary,
    leaning,
    bullish: bullish.length ? bullish : fallback.bullish,
    bearish: bearish.length ? bearish : fallback.bearish,
    risks: risks.length ? risks : fallback.risks,
    engine,
    disclaimer: DISCLAIMER,
  };
}
