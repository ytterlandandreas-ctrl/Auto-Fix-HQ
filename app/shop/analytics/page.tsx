import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnalyticsClient } from "@/components/shop/AnalyticsClient";
import { getShopKPIs, generateInsights } from "@/lib/analytics-engine";

export default async function AnalyticsPage({
  searchParams,
}: { searchParams: Promise<{ range?: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const sp = await searchParams;
  const range = (sp.range as "7d" | "30d" | "90d" | "365d") ?? "30d";

  const days = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 }[range] ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [kpis, insights] = await Promise.all([
    getShopKPIs(shopId),
    generateInsights(shopId),
  ]);

  // Revenue by day
  const payments = await db.payment.findMany({
    where: { shopId, createdAt: { gte: since }, status: "succeeded" },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const revenueMap = new Map<string, number>();
  for (const p of payments) {
    const day = p.createdAt.toISOString().split("T")[0];
    revenueMap.set(day, (revenueMap.get(day) ?? 0) + p.amount);
  }
  const revenueByDay = Array.from(revenueMap.entries()).map(([date, revenue]) => ({ date, revenue }));

  // ROs by status
  const rosByStatus = await db.repairOrder.groupBy({
    by: ["status"],
    where: { shopId, createdAt: { gte: since } },
    _count: { id: true },
  });

  // Top services (from RO line items)
  const topServices = await db.rOLineItem.groupBy({
    by: ["description"],
    where: { repairOrder: { shopId, createdAt: { gte: since } }, type: "labor" },
    _count: { id: true },
    _sum: { total: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Tech efficiency scores
  const techEfficiency = await db.technicianEfficiencyScore.findMany({
    where: { shopId, date: { gte: since } },
    include: { technician: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  // Aggregate per tech
  const techMap = new Map<string, { name: string; billedH: number; clockedH: number; count: number }>();
  for (const s of techEfficiency) {
    const existing = techMap.get(s.technicianId) ?? { name: s.technician.name, billedH: 0, clockedH: 0, count: 0 };
    techMap.set(s.technicianId, {
      ...existing,
      billedH: existing.billedH + s.billedHours,
      clockedH: existing.clockedH + s.clockedHours,
      count: existing.count + 1,
    });
  }
  const techStats = Array.from(techMap.values()).map((t) => ({
    name: t.name,
    efficiency: t.clockedH > 0 ? Math.round((t.billedH / t.clockedH) * 100) : 0,
    billedHours: t.billedH,
    clockedHours: t.clockedH,
  })).sort((a, b) => b.efficiency - a.efficiency);

  // Parts margin
  const parts = await db.rOLineItem.findMany({
    where: { repairOrder: { shopId, createdAt: { gte: since } }, type: "part" },
    select: { quantity: true, unitPrice: true, total: true },
  });
  const partsRevenue = parts.reduce((sum, p) => sum + (p.total ?? 0), 0);
  const partsMargin = partsRevenue > 0 ? Math.round(((partsRevenue - partsRevenue * 0.65) / partsRevenue) * 100) : 0;

  return (
    <AnalyticsClient
      kpis={kpis}
      insights={insights}
      revenueByDay={revenueByDay}
      rosByStatus={rosByStatus.map((r) => ({ status: r.status, count: r._count.id }))}
      topServices={topServices.map((s) => ({ description: s.description, count: s._count.id, revenue: s._sum.total ?? 0 }))}
      techStats={techStats}
      partsMarginPct={partsMargin}
      range={range}
    />
  );
}
