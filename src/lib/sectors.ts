/**
 * Sector radar — a lightweight, transparent read of which market sectors the
 * current news flow is focused on, and whether the tone leans positive or
 * negative. Heuristic keyword matching over headlines (no extra API calls, so
 * it's instant). This is news momentum, NOT a forecast — labelled as such.
 */

import type { NewsItem } from "./types";

interface SectorDef {
  name: string;
  emoji: string;
  keywords: string[];
}

const SECTORS: SectorDef[] = [
  { name: "Semiconductors & AI", emoji: "🧠", keywords: ["chip", "chips", "semiconductor", "semiconductors", "nvidia", "amd", "tsmc", "tsm", "gpu", "artificial intelligence", "ai", "data center", "broadcom", "micron", "asml", "quantum computing"] },
  { name: "Big Tech", emoji: "💻", keywords: ["apple", "microsoft", "google", "alphabet", "amazon", "meta", "tech sector", "tech stocks", "megacap", "megacaps", "mag 7", "magnificent seven", "software stocks"] },
  { name: "Energy", emoji: "🛢️", keywords: ["oil", "crude", "opec", "natural gas", "drilling", "exxon", "chevron", "hormuz", "pipeline"] },
  { name: "Financials", emoji: "🏦", keywords: ["bank", "banks", "the fed", "interest rate", "interest rates", "rate hike", "rate cut", "jpmorgan", "bond yields", "treasury yields", "goldman", "inflation"] },
  { name: "Healthcare & Pharma", emoji: "💊", keywords: ["pharma", "pharmaceutical", "fda", "biotech", "healthcare", "vaccine", "eli lilly", "pfizer", "drugmaker"] },
  { name: "Consumer & Retail", emoji: "🛒", keywords: ["retail", "retailer", "consumer spending", "consumer confidence", "shoppers", "walmart", "costco"] },
  { name: "Crypto & Blockchain", emoji: "₿", keywords: ["bitcoin", "crypto", "ethereum", "blockchain", "coinbase", "digital asset"] },
  { name: "Autos & EV", emoji: "🚗", keywords: ["tesla", "electric vehicle", "electric vehicles", "ev sales", "automaker", "rivian"] },
  { name: "Industrials & Defense", emoji: "🏭", keywords: ["boeing", "defense stocks", "aerospace", "industrial"] },
  { name: "Housing & Real Estate", emoji: "🏠", keywords: ["housing", "mortgage", "real estate", "homebuilder"] },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Precompiled word-boundary matchers so "ai" won't match "again" and "ev" won't
// match "every". Matched against the headline only (summaries are noisy).
const SECTOR_MATCHERS = SECTORS.map((def) => ({
  def,
  regexes: def.keywords.map((k) => new RegExp(`\\b${escapeRegex(k)}\\b`, "i")),
}));

const POSITIVE = ["surge", "rally", "gains", "jumps", "soar", "beat", "record", "upgrade", "optimism", "strong", "rise", "climbs", "boom", "relief", "confident"];
const NEGATIVE = ["fall", "drop", "sink", "slump", "plunge", "miss", "downgrade", "fear", "recession", "weak", "cut", "slides", "warning", "selloff", "correction", "crash", "tumble"];

export interface SectorInsight {
  name: string;
  emoji: string;
  mentions: number;
  score: number; // net sentiment-weighted focus
  lean: "heating up" | "cooling" | "in focus";
  drivers: string[]; // representative headlines
}

function toneOf(text: string): number {
  const t = text.toLowerCase();
  let s = 0;
  for (const w of POSITIVE) if (t.includes(w)) s += 1;
  for (const w of NEGATIVE) if (t.includes(w)) s -= 1;
  return s;
}

export function predictSectors(news: NewsItem[], topN = 5): SectorInsight[] {
  // Track *mentions* (how much the news talks about a sector) separately from
  // *tone* (whether that coverage is positive or negative) so the two don't mix.
  const acc = new Map<string, { def: SectorDef; mentions: number; tone: number; drivers: string[] }>();

  news.forEach((n) => {
    const title = n.title;
    const tone = n.sentiment === "positive" ? 1 : n.sentiment === "negative" ? -1 : toneOf(title);

    for (const { def, regexes } of SECTOR_MATCHERS) {
      if (regexes.some((re) => re.test(title))) {
        const cur = acc.get(def.name) ?? { def, mentions: 0, tone: 0, drivers: [] };
        cur.mentions += 1;
        cur.tone += tone;
        if (cur.drivers.length < 3) cur.drivers.push(title);
        acc.set(def.name, cur);
      }
    }
  });

  return [...acc.values()]
    .sort((a, b) => b.mentions - a.mentions || b.tone - a.tone)
    .slice(0, topN)
    .map((c) => {
      const avgTone = c.tone / c.mentions; // average sentiment of its coverage
      return {
        name: c.def.name,
        emoji: c.def.emoji,
        mentions: c.mentions,
        score: Math.round(avgTone * 10) / 10,
        lean: avgTone > 0.25 ? "heating up" : avgTone < -0.25 ? "cooling" : "in focus",
        drivers: c.drivers,
      };
    });
}
