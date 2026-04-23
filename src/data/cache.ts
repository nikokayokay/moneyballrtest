type CacheEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export const DATA_TTL = {
  live: 15_000,
  nearLive: 120_000,
  static: 24 * 60 * 60_000,
};

export async function cachedJson<T>(url: string, ttlMs = DATA_TTL.nearLive): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(url) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) return cached.value;

  const value = fetch(url, { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw new Error(`Data request failed: ${response.status} ${url}`);
    return response.json() as Promise<T>;
  });

  memoryCache.set(url, { expiresAt: now + ttlMs, value });
  return value;
}

export function clearDataCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  [...memoryCache.keys()].forEach((key) => {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  });
}
