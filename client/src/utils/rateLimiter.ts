import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    __retryCount?: number;
  }
}

// --- Token bucket configuration ---
const MAX_TOKENS = 40;
const REFILL_INTERVAL_MS = 1000;

// --- State ---
let tokens = MAX_TOKENS;
let lastRefill = Date.now();
const queue: Array<() => void> = [];

function refillTokens(): void {
  const now = Date.now();
  const elapsed = now - lastRefill;
  if (elapsed <= 0) return;
  tokens = Math.min(
    MAX_TOKENS,
    tokens + (elapsed / REFILL_INTERVAL_MS) * MAX_TOKENS,
  );
  lastRefill = now;
}

function drainQueue(): void {
  if (queue.length === 0) return;
  refillTokens();
  while (queue.length > 0 && tokens >= 1) {
    tokens -= 1;
    const next = queue.shift()!;
    next();
  }
  if (queue.length > 0) {
    const msPerToken = REFILL_INTERVAL_MS / MAX_TOKENS;
    setTimeout(drainQueue, msPerToken);
  }
}

function getToken(): Promise<void> {
  refillTokens();
  if (tokens >= 1) {
    tokens -= 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    queue.push(resolve);
    if (queue.length === 1) {
      const msPerToken = REFILL_INTERVAL_MS / MAX_TOKENS;
      setTimeout(drainQueue, msPerToken);
    }
  });
}

// --- 429 retry configuration ---
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Public API ---

export function attachRateLimiter(client: AxiosInstance): void {
  // Gate outbound requests with the token bucket
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      await getToken();
      return config;
    },
  );

  // Retry on 429 with exponential backoff
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config: InternalAxiosRequestConfig | undefined = error.config;
      if (!config || !error.response || error.response.status !== 429) {
        return Promise.reject(error);
      }

      const retryCount = config.__retryCount ?? 0;
      if (retryCount >= MAX_RETRIES) {
        return Promise.reject(error);
      }
      config.__retryCount = retryCount + 1;

      const retryAfter = error.response.headers?.["retry-after"];
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : BASE_DELAY_MS * Math.pow(2, retryCount);

      await sleep(delayMs);
      await getToken();
      return client.request(config);
    },
  );
}
