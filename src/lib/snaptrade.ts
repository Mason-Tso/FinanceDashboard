/**
 * SnapTrade client — reads connected brokerage holdings (read-only).
 *
 * Verified against the user's live account (SnapTrade personal keys):
 *   - Auth: signed client/consumer key; user secret falls back to consumer key.
 *   - The user is auto-provisioned (id = signup email); self-discovered via
 *     listSnapTradeUsers when SNAPTRADE_USER_ID isn't set.
 *   - `getUserHoldings` is 410 (deprecated) for this account — use
 *     `getUserAccountPositions` + `getUserAccountBalance` per account.
 * Server-only. Mock until configured.
 */

import "server-only";
import { Snaptrade } from "snaptrade-typescript-sdk";
import { cached } from "./cache";
import { env } from "./env";
import { mockPortfolio } from "./mock";
import type { Portfolio, Position } from "./types";

let client: Snaptrade | null = null;
function getClient(): Snaptrade {
  if (!env.snaptrade.isConfigured) throw new Error("SnapTrade is not configured");
  if (!client) {
    client = new Snaptrade({ clientId: env.snaptrade.clientId!, consumerKey: env.snaptrade.consumerKey! });
  }
  return client;
}

let cachedUserId: string | null = null;
async function resolveUser(): Promise<{ userId: string; userSecret: string }> {
  const userSecret = env.snaptrade.userSecret!;
  let userId = env.snaptrade.userId;
  if (!userId || userId === "local-user") {
    if (!cachedUserId) {
      const users = await getClient().authentication.listSnapTradeUsers();
      cachedUserId = (users.data?.[0] as string) ?? userId;
    }
    userId = cachedUserId;
  }
  return { userId, userSecret };
}

/** SnapTrade Connection Portal URL to link an additional brokerage. */
export async function getConnectUrl(): Promise<string> {
  const user = await resolveUser();
  const res = await getClient().authentication.loginSnapTradeUser(user);
  const url = (res.data as { redirectURI?: string }).redirectURI;
  if (!url) throw new Error("SnapTrade did not return a redirect URL");
  return url;
}

type Row = Record<string, unknown>;

function pluck<T>(obj: unknown, ...keys: string[]): T | undefined {
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Row)[k];
  }
  return cur as T | undefined;
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function mapPosition(p: Row): Position {
  const symbol = String(
    pluck<string>(p, "symbol", "symbol", "symbol") ?? pluck<string>(p, "symbol", "symbol", "raw_symbol") ?? "—",
  ).toUpperCase();
  const name = String(pluck<string>(p, "symbol", "symbol", "description") ?? symbol);
  const quantity = num(p.units ?? p.fractional_units);
  const price = num(p.price);
  const avg = num(p.average_purchase_price);
  const marketValue = round(price * quantity);
  const costBasis = round(avg * quantity);
  const unrealizedPnl = p.open_pnl != null ? round(num(p.open_pnl)) : round(marketValue - costBasis);
  return {
    symbol,
    name,
    quantity: round(quantity, 4),
    averageBuyPrice: round(avg),
    price: round(price),
    marketValue,
    costBasis,
    unrealizedPnl,
    unrealizedPnlPercent: costBasis ? round((unrealizedPnl / costBasis) * 100) : 0,
    weight: 0,
  };
}

/** Fetch and normalise the connected portfolio (aggregated across accounts). */
export async function getPortfolio(): Promise<Portfolio> {
  if (!env.snaptrade.isConfigured) return mockPortfolio();
  return cached("snaptrade:portfolio", 60_000, fetchPortfolioLive);
}

async function fetchPortfolioLive(): Promise<Portfolio> {
  const sdk = getClient();
  const { userId, userSecret } = await resolveUser();
  const accountsRes = await sdk.accountInformation.listUserAccounts({ userId, userSecret });
  const accounts = accountsRes.data ?? [];
  if (accounts.length === 0) return { ...mockPortfolio(), accountName: "No brokerage linked yet — sample data" };

  const perAccount = await Promise.all(
    accounts.map(async (acct) => {
      const id = acct.id as string;
      const [posRes, balRes] = await Promise.all([
        sdk.accountInformation.getUserAccountPositions({ accountId: id, userId, userSecret }),
        sdk.accountInformation.getUserAccountBalance({ accountId: id, userId, userSecret }).catch(() => ({ data: [] })),
      ]);
      const positions = ((posRes.data ?? []) as Row[]).map(mapPosition).filter((p) => p.quantity !== 0);
      const cash = ((balRes.data ?? []) as Row[]).reduce((a, b) => a + num(b.cash), 0);
      return { positions, cash };
    }),
  );

  const positions = perAccount.flatMap((a) => a.positions);
  const cash = round(perAccount.reduce((a, x) => a + x.cash, 0));
  const invested = positions.reduce((a, p) => a + p.marketValue, 0);
  const totalValue = round(invested + cash);
  for (const p of positions) p.weight = totalValue ? round(p.marketValue / totalValue, 4) : 0;
  const totalCostBasis = round(positions.reduce((a, p) => a + p.costBasis, 0));
  const totalUnrealizedPnl = round(positions.reduce((a, p) => a + p.unrealizedPnl, 0));

  return {
    totalValue,
    cash,
    totalCostBasis,
    totalUnrealizedPnl,
    totalUnrealizedPnlPercent: totalCostBasis ? round((totalUnrealizedPnl / totalCostBasis) * 100) : 0,
    positions: positions.sort((a, b) => b.marketValue - a.marketValue),
    accountName:
      accounts.length === 1
        ? String(accounts[0].name ?? accounts[0].institution_name ?? "Brokerage account")
        : `${accounts.length} linked accounts`,
  };
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
