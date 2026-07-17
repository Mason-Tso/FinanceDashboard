/**
 * Tiny in-memory TTL cache (per server process). Keeps the dashboard snappy by
 * avoiding repeated slow upstream calls (SnapTrade, FMP) on every navigation.
 * Single-user local app, so a process-level Map is plenty.
 */

interface Entry {
  value: unknown;
  expires: number;
}

const store = new Map<string, Entry>();

/** Return a cached value if fresh, otherwise run `fn`, cache, and return it. */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value as T;
  const value = await fn();
  store.set(key, { value, expires: now + ttlMs });
  return value;
}

/** Drop a cache entry (e.g. after an action that changes the underlying data). */
export function invalidate(key: string): void {
  store.delete(key);
}
