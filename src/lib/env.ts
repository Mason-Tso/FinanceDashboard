/**
 * Centralised, typed access to environment configuration.
 *
 * Everything here is server-only — these values must never be imported into a
 * client component. Each data source exposes an `isConfigured` flag so the UI
 * can degrade gracefully (and fall back to mock data) when a key is absent.
 */

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export type AiProvider = "claude-cli" | "anthropic" | "openai" | "rules";

function readAiProvider(): AiProvider {
  const v = (read("AI_PROVIDER") ?? "rules").toLowerCase();
  if (v === "claude-cli" || v === "anthropic" || v === "openai" || v === "rules") return v;
  return "rules";
}

export const env = {
  fmp: {
    apiKey: read("FMP_API_KEY"),
    get isConfigured() {
      return Boolean(this.apiKey);
    },
  },
  quiver: {
    apiKey: read("QUIVER_API_KEY"),
    get isConfigured() {
      return Boolean(this.apiKey);
    },
  },
  snaptrade: {
    clientId: read("SNAPTRADE_CLIENT_ID"),
    consumerKey: read("SNAPTRADE_CONSUMER_KEY"),
    // Personal keys auto-provision a user (id = your SnapTrade email). If the
    // userId isn't set we self-discover it via listSnapTradeUsers at runtime.
    userId: read("SNAPTRADE_USER_ID") ?? "local-user",
    // Personal keys authenticate via the signed client/consumer key; a distinct
    // user secret isn't issued, so fall back to the consumer key.
    userSecret: read("SNAPTRADE_USER_SECRET") ?? read("SNAPTRADE_CONSUMER_KEY"),
    get isConfigured() {
      return Boolean(this.clientId && this.consumerKey);
    },
    /** Client + consumer key are enough to read the portfolio for personal keys. */
    get canReadPortfolio() {
      return Boolean(this.clientId && this.consumerKey);
    },
  },
  ai: {
    provider: readAiProvider(),
    anthropicKey: read("ANTHROPIC_API_KEY"),
    openaiKey: read("OPENAI_API_KEY"),
    model: read("AI_MODEL"),
    /** Whether the selected provider has what it needs to run. */
    get isConfigured(): boolean {
      if (this.provider === "rules") return true;
      if (this.provider === "claude-cli") return true; // uses the logged-in CLI, no key
      if (this.provider === "anthropic") return Boolean(this.anthropicKey);
      if (this.provider === "openai") return Boolean(this.openaiKey);
      return false;
    },
  },
} as const;
