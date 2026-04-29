import { db } from "@/lib/db";
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export interface ShopInsight {
  type: "success" | "warning" | "info" | "danger";
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export interface ShopKPIs {
  openROs: number;
  carsInShop: number;
  todayRevenue: number;
  monthRevenue: number;
  avgRO: number;
  avgROChange: number; // % vs last month
  inspectionApprovalRate: number;
  comebackRate: number;
  techEfficiency: number;
  overdueCount: number;
}

export async function getShopKPIs(shopId: string): Promise<ShopKPIs> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subDays(monthStart, 1));
  const lastMonthEnd = endOfMonth(subDays(monthStart, 1));

  const [
    openROs,
    todayPaid,
    monthPaid,
    lastMonthPaid,
    inspectionStats,
    comebacks,
    totalROsMonth,
    efficiencyScores,
    overdue,
  ] = await Promise.all([
    db.repairOrder.count({
      where: {
        shopId,
        status: { in: ["approved", "in_progress", "qc"] },
      },
    }),
    db.invoice.aggregate({
      where: {
        shopId,
        paidAt: { gte: todayStart, lte: todayEnd },
      },
      _sum: { paidAmount: true },
    }),
    db.invoice.aggregate({
      where: {
        shopId,
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { paidAmount: true },
    }),
    db.invoice.aggregate({
      where: {
        shopId,
        paidAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { paidAmount: true },
    }),
    db.digitalInspection.findMany({
      where: {
        shopId,
        createdAt: { gte: monthStart },
        status: { in: ["approved", "partially_approved", "declined"] },
      },
      select: { status: true },
    }),
    db.repairOrder.count({
      where: {
        shopId,
        isComeback: true,
        createdAt: { gte: monthStart },
      },
    }),
    db.repairOrder.count({
      where: {
        shopId,
        createdAt: { gte: monthStart },
        status: { notIn: ["estimate", "cancelled"] },
      },
    }),
    db.technicianEfficiencyScore.aggregate({
      where: {
        shopId,
        date: { gte: monthStart },
      },
      _avg: { efficiencyPct: true },
    }),
    db.repairOrder.count({
      where: {
        shopId,
        status: { in: ["approved", "in_progress"] },
        promisedAt: { lt: now },
      },
    }),
  ]);

  const thisMonthRevenue = monthPaid._sum.paidAmount ?? 0;
  const lastMonthRevenue = lastMonthPaid._sum.paidAmount ?? 0;
  const avgROChange =
    lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

  const approvedInspections = inspectionStats.filter(
    (i) => i.status === "approved" || i.status === "partially_approved"
  ).length;
  const inspectionApprovalRate =
    inspectionStats.length > 0
      ? (approvedInspections / inspectionStats.length) * 100
      : 0;

  const comebackRate =
    totalROsMonth > 0 ? (comebacks / totalROsMonth) * 100 : 0;

  const monthlyROs = await db.repairOrder.aggregate({
    where: {
      shopId,
      status: { in: ["completed", "invoiced", "paid"] },
      completedAt: { gte: monthStart, lte: monthEnd },
    },
    _avg: { grandTotal: true },
    _count: true,
  });

  return {
    openROs,
    carsInShop: openROs,
    todayRevenue: todayPaid._sum.paidAmount ?? 0,
    monthRevenue: thisMonthRevenue,
    avgRO: monthlyROs._avg.grandTotal ?? 0,
    avgROChange,
    inspectionApprovalRate,
    comebackRate,
    techEfficiency: efficiencyScores._avg.efficiencyPct ?? 0,
    overdueCount: overdue,
  };
}

export async function generateInsights(shopId: string): Promise<ShopInsight[]> {
  const insights: ShopInsight[] = [];
  const kpis = await getShopKPIs(shopId);
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixMonthsAgo = subDays(now, 180);

  // ARO trend insight
  if (kpis.avgROChange < -10) {
    insights.push({
      type: "warning",
      title: "ARO Dropping",
      message: `Average repair order is down ${Math.abs(kpis.avgROChange).toFixed(0)}% vs last month. Review inspection approval rates and upsell opportunities.`,
      actionLabel: "View Analytics",
      actionHref: "/shop/analytics",
    });
  }

  // Inspection approval rate
  if (kpis.inspectionApprovalRate < 60) {
    insights.push({
      type: "warning",
      title: "Low Inspection Approval Rate",
      message: `Only ${kpis.inspectionApprovalRate.toFixed(0)}% of inspections are being approved. Consider reviewing photo quality and pricing presentation.`,
      actionLabel: "View Inspections",
      actionHref: "/shop/inspections",
    });
  }

  // Comeback rate
  if (kpis.comebackRate > 5) {
    insights.push({
      type: "danger",
      title: "High Comeback Rate",
      message: `${kpis.comebackRate.toFixed(1)}% comeback rate this month exceeds the 5% threshold. Review recent comeback ROs for root cause.`,
      actionLabel: "View Comebacks",
      actionHref: "/shop/repair-orders?filter=comeback",
    });
  }

  // Technician efficiency
  if (kpis.techEfficiency > 0 && kpis.techEfficiency < 70) {
    insights.push({
      type: "warning",
      title: "Technician Efficiency Below Target",
      message: `Shop average technician efficiency is ${kpis.techEfficiency.toFixed(0)}%. Target is 80%+. Check the technician board for details.`,
      actionLabel: "Technician Board",
      actionHref: "/shop/technicians",
    });
  }

  // Overdue ROs
  if (kpis.overdueCount > 0) {
    insights.push({
      type: "danger",
      title: `${kpis.overdueCount} Overdue RO${kpis.overdueCount > 1 ? "s" : ""}`,
      message: `${kpis.overdueCount} repair order${kpis.overdueCount > 1 ? "s are" : " is"} past the promised delivery time. Contact customers immediately.`,
      actionLabel: "View Overdue",
      actionHref: "/shop/repair-orders?filter=overdue",
    });
  }

  // Low inventory
  const lowInventory = await db.inventoryItem.count({
    where: {
      shopId,
      quantityOnHand: { lte: db.inventoryItem.fields.reorderPoint },
    },
  });

  if (lowInventory > 0) {
    insights.push({
      type: "warning",
      title: `${lowInventory} Part${lowInventory > 1 ? "s" : ""} Below Reorder Point`,
      message: `${lowInventory} inventory item${lowInventory > 1 ? "s are" : " is"} at or below reorder point.`,
      actionLabel: "View Inventory",
      actionHref: "/shop/inventory?filter=low",
    });
  }

  // Win-back opportunity
  const dormantCustomers = await db.customer.count({
    where: {
      shopId,
      lastVisitAt: { lt: sixMonthsAgo },
      smsOptIn: true,
    },
  });

  if (dormantCustomers > 10) {
    insights.push({
      type: "info",
      title: `${dormantCustomers} Customers Haven't Visited in 6+ Months`,
      message: `Launch a win-back campaign to re-engage ${dormantCustomers} dormant customers.`,
      actionLabel: "Create Campaign",
      actionHref: "/shop/crm?trigger=win_back",
    });
  }

  // Positive insight
  if (kpis.avgROChange > 10) {
    insights.push({
      type: "success",
      title: "Strong ARO Growth",
      message: `Average repair order is up ${kpis.avgROChange.toFixed(0)}% vs last month. Great work!`,
    });
  }

  return insights;
}
