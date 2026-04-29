import { db } from "@/lib/db";

const INTEGRATION_ENDPOINTS: Record<string, string> = {
  quickbooks: "https://quickbooks.api.intuit.com",
  partstech: "https://api.partstech.com",
  carfax: "https://api.carfax.com",
  twilio: "https://api.twilio.com",
  stripe_connect: "https://api.stripe.com",
  paypal: "https://api-m.paypal.com",
  square: "https://connect.squareup.com",
};

async function pingEndpoint(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(timeout);
    // 401/403/404 are OK — the service is up
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function checkIntegrationHealth(shopId: string) {
  const integrations = await db.integration.findMany({
    where: { shopId, status: { not: "disconnected" } },
  });

  const results = await Promise.all(
    integrations.map(async (integration) => {
      const endpoint = INTEGRATION_ENDPOINTS[integration.type];
      const isUp = endpoint ? await pingEndpoint(endpoint) : true;

      const newStatus = isUp
        ? "healthy"
        : integration.status === "healthy"
        ? "degraded"
        : "down";

      await db.integration.update({
        where: { id: integration.id },
        data: {
          status: newStatus,
          lastCheckedAt: new Date(),
          ...(isUp ? { lastError: null } : { lastErrorAt: new Date() }),
        },
      });

      return { type: integration.type, status: newStatus };
    })
  );

  return results;
}

export async function getIntegrationSummary(shopId: string) {
  const integrations = await db.integration.findMany({
    where: { shopId },
    select: { type: true, status: true, lastCheckedAt: true, lastError: true, connectedAt: true },
  });

  return integrations.map((i) => ({
    ...i,
    isHealthy: i.status === "healthy" || i.status === "disconnected",
    needsAttention: i.status === "degraded" || i.status === "down",
  }));
}
