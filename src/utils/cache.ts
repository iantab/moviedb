interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const STORAGE_PREFIX = "moviedb:";

const TTL_MS: Record<string, number> = {
  trending: 60 * 60 * 1000, // 1 hour
  popular: 4 * 60 * 60 * 1000, // 4 hours
  search: 30 * 60 * 1000, // 30 minutes
  providers: 24 * 60 * 60 * 1000, // 24 hours
  discover: 2 * 60 * 60 * 1000, // 2 hours
};
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

function getTtl(key: string): number {
  const prefix = key.split(":")[0];
  return TTL_MS[prefix] ?? DEFAULT_TTL;
}

// --- localStorage helpers (best-effort, never throw) ---

function storageRead(key: string): CacheEntry<unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<unknown>;
  } catch {
    return null;
  }
}

function storageRemove(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}

function evictStaleEntries(): void {
  try {
    const entries: { storageKey: string; expiresAt: number }[] = [];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const storageKey = localStorage.key(i);
      if (!storageKey?.startsWith(STORAGE_PREFIX)) continue;
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw) as CacheEntry<unknown>;
        if (entry.expiresAt <= Date.now()) {
          localStorage.removeItem(storageKey);
        } else {
          entries.push({ storageKey, expiresAt: entry.expiresAt });
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    // If still tight on space, drop the oldest 25%
    if (entries.length > 0) {
      entries.sort((a, b) => a.expiresAt - b.expiresAt);
      const dropCount = Math.max(1, Math.floor(entries.length * 0.25));
      for (let i = 0; i < dropCount; i++) {
        localStorage.removeItem(entries[i].storageKey);
      }
    }
  } catch {
    // ignore
  }
}

function storageWrite(key: string, entry: CacheEntry<unknown>): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      evictStaleEntries();
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
      } catch {
        // give up — in-memory layer still has the data
      }
    }
  }
}

// --- Two-tier cache ---

const cache = new Map<string, CacheEntry<unknown>>();

function hydrateFromStorage(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const storageKey = localStorage.key(i);
      if (!storageKey?.startsWith(STORAGE_PREFIX)) continue;
      const cacheKey = storageKey.slice(STORAGE_PREFIX.length);
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw) as CacheEntry<unknown>;
        if (entry.expiresAt > Date.now()) {
          cache.set(cacheKey, entry);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  } catch {
    // localStorage unavailable — L1 starts empty
  }
}

hydrateFromStorage();

// --- Public API (unchanged signatures) ---

export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (entry) {
    if (entry.expiresAt > Date.now()) {
      return entry.value as T;
    }
    cache.delete(key);
    storageRemove(key);
    return undefined;
  }
  // L1 miss — check L2
  const stored = storageRead(key);
  if (stored && stored.expiresAt > Date.now()) {
    cache.set(key, stored);
    return stored.value as T;
  }
  if (stored) storageRemove(key);
  return undefined;
}

export function setCached<T>(key: string, value: T): void {
  const entry: CacheEntry<unknown> = {
    value,
    expiresAt: Date.now() + getTtl(key),
  };
  cache.set(key, entry);
  storageWrite(key, entry);
}

export function clearCache(): void {
  cache.clear();
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
