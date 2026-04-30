import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { IntegrationsClient } from "@/components/shop/IntegrationsClient";

export default async function IntegrationsPage() {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;

  const integrations = await db.integration.findMany({
    where: { shopId },
    orderBy: { type: "asc" },
  });

  const addons = await db.shopAddon.findMany({
    where: { shopId, isActive: true },
  });
  const activeAddons = addons.map((a) => a.addonKey);

  return <IntegrationsClient integrations={integrations as any} activeAddons={activeAddons} shopId={shopId} />;
}
