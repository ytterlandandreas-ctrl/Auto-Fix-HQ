"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { InsightCard } from "@/components/shop/InsightCard";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Wrench, Users, Clock, Package } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  estimate: "#94a3b8",
  approved: "#60a5fa",
  in_progress: "#fbbf24",
  qc: "#a78bfa",
  invoiced: "#34d399",
  paid: "#22c55e",
  cancelled: "#f87171",
};

// RANGE_OPTIONS is now translated inline using t.analytics.rangeXX

export function AnalyticsClient({ kpis, insights, revenueByDay, rosByStatus, topServices, techStats, partsMarginPct, range }: {
  kpis: any;
  insights: any[];
  revenueByDay: { date: string; revenue: number }[];
  rosByStatus: { status: string; count: number }[];
  topServices: { description: string; count: number; revenue: number }[];
  techStats: { name: string; efficiency: number; billedHours: number; clockedHours: number }[];
  partsMarginPct: number;
  range: string;
}) {
  const { t, formatCurrency } = useLocale();
  const router = useRouter();

  const RANGE_OPTIONS = [
    { label: t.analytics.range7d, value: "7d" },
    { label: t.analytics.range30d, value: "30d" },
    { label: t.analytics.range90d, value: "90d" },
    { label: t.analytics.range365d, value: "365d" },
  ];

  function setRange(r: string) {
    router.push(`/shop/analytics?range=${r}`);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.analytics.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500">{t.analytics.subtitle}</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
          {RANGE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setRange(opt.value)}
              className={cn("px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors whitespace-nowrap",
                range === opt.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label={t.dashboard.kpiARO} value={formatCurrency(kpis.aro)} icon={<TrendingUp className="w-5 h-5" />} color="blue" />
        <StatCard label={t.dashboard.kpiOpenROs} value={kpis.openROs} icon={<Wrench className="w-5 h-5" />} color="yellow" />
        <StatCard label={t.analytics.partsMargin} value={`${partsMarginPct}%`} icon={<Package className="w-5 h-5" />} color="purple" />
        <StatCard label={t.dashboard.kpiInspectionApproval} value={`${kpis.inspectionApprovalRate}%`} icon={<Users className="w-5 h-5" />} color="green" />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{t.dashboard.sectionInsights}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </div>
        </div>
      )}

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <h2 className="font-semibold text-slate-900 mb-4">{t.analytics.revenue}</h2>
        {revenueByDay.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">{t.analytics.noPaymentData}</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={((v: any) => formatCurrency(Number(v))) as any} labelFormatter={(l) => new Date(l).toLocaleDateString()} />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ROs by status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t.analytics.rosByStatus}</h2>
          {rosByStatus.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">{t.analytics.noData}</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={rosByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label={(props: any) => `${props.status} (${props.count})`}>
                  {rosByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top services */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t.analytics.topServices}</h2>
          {topServices.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">{t.analytics.noData}</div>
          ) : (
            <div className="space-y-2">
              {topServices.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-slate-700">{s.description || "—"}</span>
                  <span className="text-slate-400 text-xs">{s.count}×</span>
                  <span className="text-slate-600 font-medium text-xs">{formatCurrency(s.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tech efficiency */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t.analytics.techEfficiency}</h2>
          {techStats.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">{t.analytics.noClockData}</div>
          ) : (
            <div className="space-y-3">
              {techStats.map((tech, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">{tech.name}</span>
                    <span className={cn("font-bold",
                      tech.efficiency >= 80 ? "text-green-600" : tech.efficiency >= 60 ? "text-yellow-600" : "text-red-500"
                    )}>{tech.efficiency}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full",
                      tech.efficiency >= 80 ? "bg-green-500" : tech.efficiency >= 60 ? "bg-yellow-500" : "bg-red-500"
                    )} style={{ width: `${Math.min(tech.efficiency, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{t.technicians.billed}: {tech.billedHours.toFixed(1)}h</span>
                    <span>{t.technicians.clocked}: {tech.clockedHours.toFixed(1)}h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: any; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", colors[color])}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
