/**
 * AI analysis dispatcher. Picks a provider from AI_PROVIDER and always falls
 * back to the deterministic rules engine on any error, so analysis never breaks.
 */

import "server-only";
import { rulesAnalysis } from "../analysis";
import { env } from "../env";
import type { KeyMetrics } from "../fmp";
import type { NewsItem, Quote, StockAnalysis } from "../types";
import { runClaudeCli } from "./claudeCli";
import { parseAnalysis } from "./parse";
import { buildUserPrompt, SYSTEM_PROMPT, type AnalysisInput } from "./prompt";

// Once the local claude CLI is shown to be unavailable (e.g. not logged in),
// stop spawning it every request — fall straight back to the rules baseline.
let claudeCliUnavailable = false;

export async function analyzeStock(
  quote: Quote,
  metrics: KeyMetrics,
  news: NewsItem[],
): Promise<StockAnalysis> {
  const baseline = rulesAnalysis(quote, metrics);
  const provider = env.ai.provider;
  if (provider === "rules") return baseline;
  if (provider === "claude-cli" && claudeCliUnavailable) return baseline;

  const input: AnalysisInput = { quote, metrics, news, baseline };
  const user = buildUserPrompt(input);

  try {
    if (provider === "claude-cli") {
      const raw = await runClaudeCli(`${SYSTEM_PROMPT}\n\n${user}`, env.ai.model || "sonnet");
      const result = parseAnalysis(raw, quote.symbol, "claude-cli", baseline);
      // If it just echoed the baseline (parse failed / error result), treat as unavailable.
      if (result.summary === baseline.summary && result.bullish === baseline.bullish) {
        claudeCliUnavailable = true;
      }
      return result;
    }
    if (provider === "anthropic") {
      if (!env.ai.anthropicKey) return baseline;
      const { runAnthropic } = await import("./anthropic");
      const raw = await runAnthropic(SYSTEM_PROMPT, user, env.ai.model);
      return parseAnalysis(raw, quote.symbol, "anthropic", baseline);
    }
    if (provider === "openai") {
      if (!env.ai.openaiKey) return baseline;
      const { runOpenAI } = await import("./openai");
      const raw = await runOpenAI(SYSTEM_PROMPT, user, env.ai.model);
      return parseAnalysis(raw, quote.symbol, "openai", baseline);
    }
  } catch {
    if (provider === "claude-cli") claudeCliUnavailable = true;
    return baseline;
  }
  return baseline;
}
