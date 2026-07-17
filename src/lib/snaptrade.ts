/**
 * SnapTrade client — connects Robinhood (and other brokerages) read-only and
 * returns a normalised Portfolio.
 *
 * SnapTrade's flow needs a per-user `userSecret` returned at registration. For
 * this single-user local app we persist it to a gitignored JSON file next to
 * the project. Server-only. Falls back to mock data until configured/connected.
 */

import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Snaptrade } from "snaptrade-typescript-sdk";
import { env } from "./env";
import { mockPortfolio } from "./mock";
import type { Portfolio, Position } from "./types";

const STORE = path.join(process.cwd(), ".snaptrade-user.json");

interface StoredUser {
  userId: string;
  userSecret: string;
}

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

async function readStore(): Promise<StoredUser | null> {
  try {
    return JSON.parse(await fs.readFile(STORE, "utf8")) as StoredUser;
  } catch {
    return null;
  }
}

async function writeStore(u: StoredUser): Promise<void> {
  await fs.writeFile(STORE, JSON.stringify(u, null, 2), "utf8");
}

/** Register the local user with SnapTrade if not already, returning the secret. */
export async function ensureUser(): Promise<StoredUser> {
  const existing = await readStore();
  if (existing?.userSecret) return existing;

  const sdk = getClient();
  const userId = env.snaptrade.userId;
  const res = await sdk.authentication.registerSnapTradeUser({ userId });
  const userSecret = res.data.userSecret;
  if (!userSecret) throw new Error("SnapTrade did not return a userSecret");
  const stored: StoredUser = { userId, userSecret };
  await writeStore(stored);
  return stored;
}

/** True once the user has linked at least one brokerage. */
export async function isConnected(): Promise<boolean> {
  if (!env.snaptrade.isConfigured) return false;
  const user = await readStore();
  if (!user) return false;
  const sdk = getClient();
  const accounts = await sdk.accountInformation.listUserAccounts({
    userId: user.userId,
    userSecret: user.userSecret,
  });
  return (accounts.data?.length ?? 0) > 0;
}

/** Returns the SnapTrade Connection Portal URL to link a brokerage. */
export async function getConnectUrl(): Promise<string> {
  const user = await ensureUser();
  const sdk = getClient();
  const res = await sdk.authentication.loginSnapTradeUser({
    userId: user.userId,
    userSecret: user.userSecret,
  });
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

/** Fetch and normalise the connected portfolio; mock until configured. */
export async function getPortfolio(): Promise<Portfolio> {
  if (!env.snaptrade.isConfigured) return mockPortfolio();

  const user = await readStore();
  if (!user) return { ...mockPortfolio(), accountName: "Not linked yet — mock data" };

  const sdk = getClient();
  const accounts = await sdk.accountInformation.listUserAccounts({
    userId: user.userId,
    userSecret: user.userSecret,
  });
  const account = accounts.data?.[0];
  if (!account?.id) return { ...mockPortfolio(), accountName: "Not linked yet — mock data" };

  const holdings = await sdk.accountInformation.getUserHoldings({
    accountId: account.id,
    userId: user.userId,
    userSecret: user.userSecret,
  });

  const rawPositions = (holdings.data.positions ?? []) as Row[];
  const positions: Position[] = rawPositions.map((p) => {
    const symbol = String(pluck<string>(p, "symbol", "symbol", "symbol") ?? pluck<string>(p, "symbol", "symbol", "raw_symbol") ?? "—").toUpperCase();
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
