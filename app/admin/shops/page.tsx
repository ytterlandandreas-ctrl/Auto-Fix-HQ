import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AdminShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) {
    where.subscription = { status };
  }

  const shops = await db.shop.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      subscription: true,
      addons: { where: { isActive: true }, select: { addonKey: true } },
      _count: { select: { users: true, repairOrders: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">All Shops ({shops.length})</h1>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email..."
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select name="status" defaultValue={status || ""} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
        </select>
        <Button type="submit" variant="outline" size="sm">Filter</Button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Shop</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Add-ons</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Users</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">ROs</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Joined</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/shops/${shop.id}`} className="font-medium text-blue-600 hover:underline">
                    {shop.name}
                  </Link>
                  <p className="text-xs text-slate-400">{shop.email}</p>
                  {shop.isSuspended && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Suspended</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium",
                    shop.subscription?.status === "active" ? "bg-green-100 text-green-700" :
                    shop.subscription?.status === "trialing" ? "bg-yellow-100 text-yellow-700" :
                    shop.subscription?.status === "past_due" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {shop.subscription?.status || "No subscription"}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {shop.addons.length > 0 ? shop.addons.map((a) => a.addonKey).join(", ") : "—"}
                </td>
                <td className="px-5 py-3 text-slate-600">{shop._count.users}</td>
                <td className="px-5 py-3 text-slate-600">{shop._count.repairOrders}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">
                  {new Date(shop.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  <Link href={`/admin/shops/${shop.id}`}>
                    <Button size="sm" variant="outline">Manage</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
