import { db } from "@/lib/db";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Building2, DollarSign, TrendingUp, TrendingDown, AlertCircle, UserX } from "lucide-react";

export default async function AdminDashboardPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    totalShops,
    activeShops,
    trialingShops,
    pastDueShops,
    canceledThisMonth,
    newThisMonth,
    allSubs,
    recentCancellations,
  ] = await Promise.all([
    db.shop.count(),
    db.shopSubscription.count({ where: { status: "active" } }),
    db.shopSubscription.count({ where: { status: "trialing" } }),
    db.shopSubscription.count({ where: { status: "past_due" } }),
    db.shopSubscription.count({ where: { status: "canceled", canceledAt: { gte: monthStart } } }),
    db.shop.count({ where: { createdAt: { gte: monthStart } } }),
    db.shopSubscription.findMany({
      where: { status: { in: ["active", "trialing"] } },
      select: { status: true },
    }),
    db.shopSubscription.findMany({
      where: { status: "canceled", canceledAt: { gte: monthStart } },
      include: {
        shop: { select: { id: true, name: true, email: true } },
      },
      orderBy: { canceledAt: "desc" },
      take: 10,
    }),
  ]);

  const BASE_PRICE = 149;
  const MRR = (activeShops + trialingShops) * BASE_PRICE;
  const ARR = MRR * 12;
  const churnRate = totalShops > 0 ? ((canceledThisMonth / totalShops) * 100).toFixed(1) : "0.0";

  const recentShops = await db.shop.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { subscription: { select: { status: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500">Auto Fix HQ SaaS Admin Console</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPI label="MRR" value={formatCurrency(MRR)} icon={DollarSign} color="bg-green-50 text-green-600" />
        <AdminKPI label="ARR" value={formatCurrency(ARR)} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
        <AdminKPI label="Active Shops" value={activeShops.toString()} icon={Building2} color="bg-purple-50 text-purple-600" />
        <AdminKPI label="Trialing" value={trialingShops.toString()} icon={Building2} color="bg-yellow-50 text-yellow-600" />
        <AdminKPI label="New This Month" value={newThisMonth.toString()} icon={TrendingUp} color="bg-green-50 text-green-600" />
        <AdminKPI label="Past Due" value={pastDueShops.toString()} icon={AlertCircle} color={pastDueShops > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"} />
        <AdminKPI label="Churned (Month)" value={canceledThisMonth.toString()} icon={UserX} color={canceledThisMonth > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"} />
        <AdminKPI label="Churn Rate" value={`${churnRate}%`} icon={TrendingDown} color="bg-slate-50 text-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent shops */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Recent Shops</h2>
            <a href="/admin/shops" className="text-sm text-blue-600 hover:underline">View all →</a>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {recentShops.map((shop) => (
                <tr key={shop.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <a href={`/admin/shops/${shop.id}`} className="font-medium text-blue-600 hover:underline">{shop.name}</a>
                    <p className="text-xs text-slate-400">{shop.email}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      shop.subscription?.status === "active" ? "bg-green-100 text-green-700" :
                      shop.subscription?.status === "trialing" ? "bg-yellow-100 text-yellow-700" :
                      shop.subscription?.status === "past_due" ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {shop.subscription?.status || "no sub"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs">
                    {new Date(shop.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent cancellations */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Cancellations This Month</h2>
          </div>
          {recentCancellations.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400">No cancellations this month 🎉</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentCancellations.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-50">
                    <td className="px-5 py-3">
                      <a href={`/admin/shops/${sub.shop.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                        {sub.shop.name}
                      </a>
                      {sub.cancelReason && (
                        <p className="text-xs text-slate-400 mt-0.5">Reason: {sub.cancelReason}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400 text-xs">
                      {sub.canceledAt ? new Date(sub.canceledAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminKPI({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <span className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
