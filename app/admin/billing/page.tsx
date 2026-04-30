import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default async function AdminBillingPage() {
  const session = await auth();
  if ((session!.user as any).role !== "platform_owner") return null;

  const [pastDue, recentPayments] = await Promise.all([
    db.shopSubscription.findMany({
      where: { status: "past_due" },
      include: { shop: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.payment.findMany({
      include: {
        invoice: { include: { repairOrder: { include: { customer: { select: { firstName: true, lastName: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const totalPastDueRevenue = pastDue.length * 149;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Payments</h1>
        <p className="text-sm text-slate-500">Monitor payment processing and dunning</p>
      </div>

      {/* Past due alert */}
      {pastDue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">{pastDue.length} shops past due</p>
            <p className="text-sm text-red-600">
              {formatCurrency(totalPastDueRevenue)}/mo at risk. Stripe is retrying automatically; manual intervention may be needed after 3 failed attempts.
            </p>
          </div>
        </div>
      )}

      {/* Past due table */}
      {pastDue.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <h2 className="font-semibold text-slate-900 px-5 py-3 border-b border-slate-100">Past Due Subscriptions</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Shop</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Email</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Past Due Since</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Amount</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {pastDue.map((sub) => (
                <tr key={sub.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/admin/shops/${sub.shop.id}`} className="text-purple-600 hover:underline">
                      {sub.shop.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{sub.shop.email}</td>
                  <td className="px-5 py-3 text-right text-slate-500 text-xs">
                    {new Date(sub.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-red-600">$149.00</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-xs text-purple-600 hover:underline flex items-center gap-1 ml-auto">
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent payments (Stripe Connect from shops) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="font-semibold text-slate-900 px-5 py-3 border-b border-slate-100">
          Recent Customer Payments (via Stripe Connect)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Customer</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Amount</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Platform Fee (1.5%)</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Method</th>
            </tr>
          </thead>
          <tbody>
            {recentPayments.map((p) => (
              <tr key={p.id} className="border-b border-slate-50">
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-slate-700">
                  {p.invoice?.repairOrder?.customer?.firstName} {p.invoice?.repairOrder?.customer?.lastName}
                </td>
                <td className="px-5 py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                <td className="px-5 py-3 text-right text-green-600 font-medium">
                  {formatCurrency(p.amount * 0.015)}
                </td>
                <td className="px-5 py-3 text-xs capitalize text-slate-500">{p.method}</td>
              </tr>
            ))}
            {recentPayments.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No customer payments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
