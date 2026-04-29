import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CRMClient } from "@/components/shop/CRMClient";
import { CRMGate } from "@/components/shop/CRMGate";

export default async function CRMPage() {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;

  const subscription = await db.shopSubscription.findFirst({
    where: { shopId, status: { in: ["active", "trialing"] } },
    include: { addons: true },
  });

  const hasCRM = subscription?.addons?.some((a) => a.addonKey === "crm") ?? false;

  if (!hasCRM) {
    return <CRMGate />;
  }

  const [campaigns, stats] = await Promise.all([
    db.cRMCampaign.findMany({
      where: { shopId },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    // Win-back candidates: no visit > 180 days
    db.customer.count({
      where: {
        shopId,
        lastVisitAt: { lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const oilChangeDue = await db.customer.count({
    where: {
      shopId,
      lastVisitAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
  });

  return (
    <CRMClient
      campaigns={campaigns as any}
      winBackCount={stats}
      oilChangeDueCount={oilChangeDue}
    />
  );
}
