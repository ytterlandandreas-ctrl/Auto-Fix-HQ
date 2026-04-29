import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const CACHE_KEYS = {
  shopDashboard: (shopId: string) => `shop:${shopId}:dashboard`,
  shopInsights: (shopId: string) => `shop:${shopId}:insights`,
  integrationHealth: (shopId: string) => `shop:${shopId}:integration-health`,
  roList: (shopId: string) => `shop:${shopId}:ro-list`,
};

export const CACHE_TTL = {
  dashboard: 60,     // 1 minute
  insights: 300,     // 5 minutes
  integrations: 900, // 15 minutes
  roList: 30,        // 30 seconds
};

export async function invalidateShopCache(shopId: string) {
  const keys = Object.values(CACHE_KEYS).map((fn) => fn(shopId));
  if (keys.length > 0) await redis.del(...keys);
}

// Simple idempotency key check for Stripe webhooks
export async function isIdempotentKey(key: string): Promise<boolean> {
  const result = await redis.set(key, "1", { nx: true, ex: 86400 });
  return result === null; // null means key already existed
}
