"use client";

import { KPICard } from "@/components/shop/KPICard";
import { InsightCard } from "@/components/shop/InsightCard";
import { RecentROsTable } from "@/components/shop/RecentROsTable";
import {
  DollarSign,
  ClipboardList,
  Car,
  TrendingUp,
  Clock,
  Star,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function DashboardClient({ kpis, insights, recentROs }: {
  kpis: any;
  insights: any[];
  recentROs: any[];
}) {
  const { t, formatCurrency } = useLocale();

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.dashboard.title}</h1>
        <p className="text-slate-500 text-sm">{t.dashboard.subtitle}</p>
      </div>

      {/* KPI Grid — 2 cols mobile, 4 cols tablet+ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label={t.dashboard.kpiOpenROs}
          value={kpis.openROs.toString()}
          icon={ClipboardList}
          color="blue"
          href="/shop/repair-orders?filter=open"
        />
        <KPICard
          label={t.dashboard.kpiRevenueToday}
          value={formatCurrency(kpis.todayRevenue)}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          label="MTD"
          value={formatCurrency(kpis.monthRevenue)}
          icon={TrendingUp}
          color="purple"
          change={kpis.avgROChange}
        />
        <KPICard
          label={t.dashboard.kpiARO}
          value={formatCurrency(kpis.avgRO)}
          icon={Car}
          color="orange"
          change={kpis.avgROChange}
        />
        <KPICard
          label={t.dashboard.kpiInspectionApproval}
          value={`${kpis.inspectionApprovalRate.toFixed(0)}%`}
          icon={Star}
          color="yellow"
          href="/shop/inspections"
        />
        <KPICard
          label={t.dashboard.kpiTechEfficiency}
          value={`${kpis.techEfficiency.toFixed(0)}%`}
          icon={Zap}
          color={kpis.techEfficiency >= 80 ? "green" : "orange"}
          href="/shop/technicians"
        />
        <KPICard
          label={t.ro.comeback}
          value={`${kpis.comebackRate.toFixed(1)}%`}
          icon={Clock}
          color={kpis.comebackRate > 5 ? "red" : "green"}
        />
        <KPICard
          label={t.ro.overdue}
          value={kpis.overdueCount.toString()}
          icon={AlertCircle}
          color={kpis.overdueCount > 0 ? "red" : "green"}
          href="/shop/repair-orders?filter=overdue"
        />
      </div>

      {/* Insights */}
      {insights.length > 0 ? (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
            {t.dashboard.sectionInsights}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Recent ROs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">{t.dashboard.sectionRecentROs}</h2>
          <a href="/shop/repair-orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            {t.common.view} →
          </a>
        </div>
        <RecentROsTable ros={recentROs} />
      </div>
    </div>
  );
}
