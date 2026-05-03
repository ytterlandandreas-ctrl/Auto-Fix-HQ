import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function AdminAnalyticsPage({
  searchParams,
}: { searchParams: Promise<{ range?: string }> }) {
  const session = await auth();
  if ((session!.user as any).role !== "platform_owner") return null;

  const sp = await searchParams;
  const range = sp.range ?? "30d";
  const days = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 }[range] ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [totalActive, totalTrialing, totalCanceled, newSignups, addonBreakdown] = await Promise.all([
    db.shopSubscription.count({ where: { status: "active" } }),
    db.shopSubscription.count({ where: { status: "trialing" } }),
    db.shopSubscription.count({ where: { status: "canceled", updatedAt: { gte: since } } }),
    db.shopSubscription.count({ where: { createdAt: { gte: since } } }),
    db.shopAddon.groupBy({ by: ["addonKey"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
  ]);

  const ADDON_PRICES: Record<string, number> = {
    quickbooks: 25, crm: 29, dvi_pro: 19, partstech: 15,
    google_reviews: 19, tech_suite: 19, collision: 39, sms_campaigns: 29,
  };

  const MRR = totalActive * 149 + addonBreakdown.reduce((sum: number, a: { addonKey: string; _count: { id: number } }) => {
    return sum + (a._count.id * (ADDON_PRICES[a.addonKey] ?? 0));
  }, 0);

  const churnRate = totalActive + totalCanceled > 0
    ? ((totalCanceled / (totalActive + totalCanceled)) * 100).toFixed(1)
    : "0.0";

  const RANGES = ["7d", "30d", "90d", "365d"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
          <p className="text-sm text-slate-500">Business intelligence for Auto Fix HQ</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {RANGES.map((r) => (
            <a key={r} href={`/admin/analytics?range=${r}`}
              className={`px-3 py-1.5 text-sm rounded-md font-medium ${range === r ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
              {r}
            </a>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">MRR</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(MRR)}</p>
          <p className="text-xs text-slate-400 mt-1">ARR: {formatCurrency(MRR * 12)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Shops</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalActive}</p>
          <p className="text-xs text-slate-400 mt-1">{totalTrialing} trialing</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">New Signups</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{newSignups}</p>
          <p className="text-xs text-slate-400 mt-1">Last {days} days</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Churn Rate</p>
          <p className={`text-3xl font-bold mt-1 ${parseFloat(churnRate) > 5 ? "text-red-600" : "text-slate-900"}`}>{churnRate}%</p>
          <p className="text-xs text-slate-400 mt-1">{totalCanceled} canceled</p>
        </div>
      </div>

      {/* Add-on adoption */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Add-on Adoption</h2>
        <div className="space-y-3">
          {addonBreakdown.map((a: { addonKey: string; _count: { id: number } }) => {
            const total = totalActive + totalTrialing || 1;
            const pct = Math.round((a._count.id / total) * 100);
            const price = ADDON_PRICES[a.addonKey] ?? 0;
            return (
              <div key={a.addonKey} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium capitalize">{a.addonKey.replace("_", " ")}</span>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>{a._count.id} shops ({pct}%)</span>
                    <span className="font-medium text-slate-700">{formatCurrency(a._count.id * price)}/mo</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {addonBreakdown.length === 0 && (
            <p className="text-sm text-slate-400">No add-ons active yet</p>
          )}
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Revenue Breakdown</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Base plan revenue</span>
              <span className="font-medium">{formatCurrency(totalActive * 149)}/mo</span>
            </div>
            {addonBreakdown.map((a: { addonKey: string; _count: { id: number } }) => (
              <div key={a.addonKey} className="flex justify-between text-xs">
                <span className="text-slate-400 capitalize">{a.addonKey.replace("_", " ")}</span>
                <span className="text-slate-600">{formatCurrency(a._count.id * (ADDON_PRICES[a.addonKey] ?? 0))}/mo</span>
              </div>
            ))}
          </div>
          <div className="border-l border-slate-100 pl-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Total MRR</span>
              <span className="font-bold text-green-600">{formatCurrency(MRR)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">ARR run rate</span>
              <span className="font-bold text-green-600">{formatCurrency(MRR * 12)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Avg revenue/shop</span>
              <span className="font-medium">{formatCurrency(totalActive > 0 ? MRR / totalActive : 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
