import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubscriptionActionsClient } from "@/components/admin/SubscriptionActionsClient";

export default async function AdminSubscriptionsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const session = await auth();
  if ((session!.user as any).role !== "platform_owner") return null;

  const sp = await searchParams;
  const status = sp.status;
  const q = sp.q;

  const where: any = {};
  if (status) where.status = status;

  let subscriptions = await db.shopSubscription.findMany({
    where,
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          email: true,
          trialEndsAt: true,
          addons: true,
          integrations: {
            where: { type: { in: ["stripe_connect", "paypal", "square"] } },
            select: { type: true, status: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  if (q) {
    const needle = q.toLowerCase();
    subscriptions = subscriptions.filter((s) =>
      s.shop?.name?.toLowerCase().includes(needle)
    );
  }

  // Surface addons at the subscription level for the consumer component
  const enriched = subscriptions.map((s) => ({
    ...s,
    addons: s.shop?.addons ?? [],
  }));

  const totals = {
    active: enriched.filter((s) => s.status === "active").length,
    trialing: enriched.filter((s) => s.status === "trialing").length,
    past_due: enriched.filter((s) => s.status === "past_due").length,
    canceled: enriched.filter((s) => s.status === "canceled").length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <div className="flex gap-6 mt-2 text-sm">
          {Object.entries(totals).map(([k, v]) => (
            <span key={k} className="text-slate-500 capitalize">
              {k.replace("_", " ")}: <span className="font-bold text-slate-900">{v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search shop name..."
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <select name="status" defaultValue={status ?? ""}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
          <option value="">All statuses</option>
          {["active", "trialing", "past_due", "canceled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
          Filter
        </button>
      </form>

      <SubscriptionActionsClient subscriptions={enriched as any} />
    </div>
  );
}
