"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { ROStatus } from "@prisma/client";

const STATUS_STYLES: Record<string, string> = {
  estimate: "bg-slate-100 text-slate-700",
  approved: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  qc: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  invoiced: "bg-orange-100 text-orange-700",
  paid: "bg-green-200 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

type RO = {
  id: string;
  roNumber: string;
  status: ROStatus;
  grandTotal: number;
  isComeback: boolean;
  updatedAt: Date;
  customer: { firstName: string; lastName: string };
  vehicle: { year: number; make: string; model: string };
};

export function RecentROsTable({ ros }: { ros: RO[] }) {
  const { t, formatCurrency } = useLocale();

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      estimate: t.ro.statusEstimate,
      approved: t.ro.statusApproved,
      in_progress: t.ro.statusInProgress,
      qc: t.ro.statusQC,
      completed: t.common.success,
      invoiced: t.ro.statusInvoiced,
      paid: t.ro.statusPaid,
      cancelled: t.ro.statusCancelled,
    };
    return map[status] ?? status;
  };

  if (ros.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center text-slate-400">
        <Link href="/shop/repair-orders/new" className="text-blue-600 font-medium hover:underline">
          {t.ro.newRO} →
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card stack */}
      <div className="md:hidden space-y-2">
        {ros.map((ro) => (
          <Link key={ro.id} href={`/shop/repair-orders/${ro.id}`}
            className="block bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-blue-600 font-medium text-sm">#{ro.roNumber}</span>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[ro.status])}>
                {statusLabel(ro.status)}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800">{ro.customer.firstName} {ro.customer.lastName}</p>
            <p className="text-xs text-slate-500">{ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}</p>
            <div className="flex items-center justify-between mt-1.5">
              {ro.isComeback && (
                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{t.ro.comeback}</span>
              )}
              <span className="font-semibold text-slate-900 text-sm ml-auto">{formatCurrency(ro.grandTotal)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500">{t.ro.roNumber}</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">{t.ro.customer}</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">{t.ro.vehicle}</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">{t.common.status}</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">{t.common.total}</th>
            </tr>
          </thead>
          <tbody>
            {ros.map((ro) => (
              <tr key={ro.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/shop/repair-orders/${ro.id}`} className="font-mono text-blue-600 hover:underline font-medium">
                    #{ro.roNumber}
                  </Link>
                  {ro.isComeback && (
                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{t.ro.comeback}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {ro.customer.firstName} {ro.customer.lastName}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", STATUS_STYLES[ro.status])}>
                    {statusLabel(ro.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatCurrency(ro.grandTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
