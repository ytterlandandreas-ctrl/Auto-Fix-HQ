import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { ExternalLink, FileText } from "lucide-react";

export default async function EstimatesPage() {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;

  const estimates = await db.estimate.findMany({
    where: { shopId },
    include: {
      repairOrder: {
        select: {
          id: true, roNumber: true,
          customer: { select: { firstName: true, lastName: true } },
          vehicle: { select: { year: true, make: true, model: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-600",
    expired: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Estimates</h1>
        <p className="text-sm text-slate-500">{estimates.length} estimates</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Estimate</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Customer</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Vehicle</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Total</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Created</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Portal</th>
            </tr>
          </thead>
          <tbody>
            {estimates.map((est) => (
              <tr key={est.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/shop/repair-orders/${est.repairOrder.id}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> #{est.estimateNumber}
                  </Link>
                  <p className="text-xs text-slate-400">RO #{est.repairOrder.roNumber}</p>
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {est.repairOrder.customer.firstName} {est.repairOrder.customer.lastName}
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {est.repairOrder.vehicle.year} {est.repairOrder.vehicle.make} {est.repairOrder.vehicle.model}
                </td>
                <td className="px-5 py-3 text-right font-semibold">{formatCurrency(est.total)}</td>
                <td className="px-5 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[est.status])}>
                    {est.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-slate-400 text-xs">
                  {new Date(est.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <a href={`/portal/estimate/${est.token}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
            {estimates.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No estimates yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
