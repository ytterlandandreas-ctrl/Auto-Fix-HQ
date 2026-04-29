import { auth } from "@/lib/auth";
import { getShopKPIs, generateInsights } from "@/lib/analytics-engine";
import { db } from "@/lib/db";
import { DashboardClient } from "@/components/shop/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;

  const [kpis, insights, recentROs] = await Promise.all([
    getShopKPIs(shopId),
    generateInsights(shopId),
    db.repairOrder.findMany({
      where: { shopId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        vehicle: { select: { year: true, make: true, model: true } },
      },
    }),
  ]);

  return <DashboardClient kpis={kpis} insights={insights} recentROs={recentROs as any} />;
}
