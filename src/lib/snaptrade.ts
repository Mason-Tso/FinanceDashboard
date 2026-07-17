/**
 * SnapTrade client — reads the connected Robinhood portfolio (read-only).
 *
 * This app uses SnapTrade **personal keys**, where a single user is
 * auto-provisioned at signup (userId = your SnapTrade email) and `registerUser`
 * is not available. So we authenticate with the userId + userSecret supplied via
 * env rather than registering a user. Server-only. Mock until userSecret is set.
 */

import "server-only";
import { Snaptrade } from "snaptrade-typescript-sdk";
import { env } from "./env";
import { mockPortfolio } from "./mock";
import type { Portfolio, Position } from "./types";

let client: Snaptrade | null = null;
function getClient(): Snaptrade {
  if (!env.snaptrade.isConfigured) throw new Error("SnapTrade is not configured");
  if (!client) {
    client = new Snaptrade({
      clientId: env.snaptrade.clientId!,
      consumerKey: env.snaptrade.consumerKey!,
    });
  }
  return client;
}

function getUser(): { userId: string; userSecret: string } {
  if (!env.snaptrade.userSecret) throw new Error("SNAPTRADE_USER_SECRET is not set");
  return { userId: env.snaptrade.userId, userSecret: env.snaptrade.userSecret };
}

/** True once at least one brokerage is linked to the user. */
export async function isConnected(): Promise<boolean> {
  if (!env.snaptrade.isConfigured || !env.snaptrade.userSecret) return false;
  const accounts = await getClient().accountInformation.listUserAccounts(getUser());
  return (accounts.data?.length ?? 0) > 0;
}

/** SnapTrade Connection Portal URL to link an additional brokerage. */
export async function getConnectUrl(): Promise<string> {
  const res = await getClient().authentication.loginSnapTradeUser(getUser());
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

/** Fetch and normalise the connected portfolio; mock until userSecret is set. */
export async function getPortfolio(): Promise<Portfolio> {
  if (!env.snaptrade.isConfigured) return mockPortfolio();
  if (!env.snaptrade.userSecret) {
    return { ...mockPortfolio(), accountName: "Add SNAPTRADE_USER_SECRET to go live — sample data" };
  }

  const sdk = getClient();
  const user = getUser();
  const accounts = await sdk.accountInformation.listUserAccounts(user);
  const account = accounts.data?.[0];
  if (!account?.id) return { ...mockPortfolio(), accountName: "No brokerage linked yet — sample data" };

  const holdings = await sdk.accountInformation.getUserHoldings({
    accountId: account.id,
    userId: user.userId,
    userSecret: user.userSecret,
  });

  const rawPositions = (holdings.data.positions ?? []) as Row[];
  const positions: Position[] = rawPositions.map((p) => {
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
      quantity,
      averageBuyPrice: avg,
      price,
      marketValue,
      costBasis,
      unrealizedPnl,
      unrealizedPnlPercent: costBasis ? round((unrealizedPnl / costBasis) * 100) : 0,
      weight: 0,
    };
  });

  const balances = (holdings.data.balances ?? []) as Row[];
  const cash = round(balances.reduce((a, b) => a + num(b.cash), 0));
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
    accountName: String(pluck<string>(account, "name") ?? account.institution_name ?? "Brokerage account"),
  };
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
