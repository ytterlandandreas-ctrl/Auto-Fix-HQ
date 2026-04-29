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
  id: string; roNumber: string; status: ROStatus; grandTotal: number;
  isComeback: boolean; promisedAt: Date | null; createdAt: Date;
  customer: { firstName: string; lastName: string };
  vehicle: { year: number; make: string; model: string };
  writer: { name: string } | null;
};

export function ROListTable({ ros }: { ros: RO[] }) {
  const { t, formatCurrency, locale } = useLocale();

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      estimate: t.ro.statusEstimate, approved: t.ro.statusApproved,
      in_progress: t.ro.statusInProgress, qc: t.ro.statusQC,
      completed: t.common.success, invoiced: t.ro.statusInvoiced,
      paid: t.ro.statusPaid, cancelled: t.ro.statusCancelled,
    };
    return map[s] ?? s;
  };

  if (!ros.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
        {t.common.noResults}
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {ros.map((ro) => {
          const overdue = ro.promisedAt && ro.promisedAt < new Date() && ["approved", "in_progress"].includes(ro.status);
          return (
            <Link key={ro.id} href={`/shop/repair-orders/${ro.id}`}
              className={cn("block bg-white rounded-xl border p-3 hover:border-blue-300", overdue ? "border-red-200 bg-red-50/30" : "border-slate-200")}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-blue-600 text-sm">#{ro.roNumber}</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[ro.status])}>
                  {statusLabel(ro.status)}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800">{ro.customer.firstName} {ro.customer.lastName}</p>
              <p className="text-xs text-slate-500">{ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-slate-400">{ro.writer?.name || "—"}</span>
                <span className="font-semibold text-slate-900 text-sm">{formatCurrency(ro.grandTotal)}</span>
              </div>
              {ro.isComeback && <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{t.ro.comeback}</span>}
            </Link>
          );
        })}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">{t.ro.roNumber}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">{t.ro.customer}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">{t.ro.vehicle}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">{t.common.status}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">{t.ro.assignedTech}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">{t.common.date}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">{t.common.total}</th>
              </tr>
            </thead>
            <tbody>
              {ros.map((ro) => {
                const overdue = ro.promisedAt && ro.promisedAt < new Date() && ["approved", "in_progress"].includes(ro.status);
                return (
                  <tr key={ro.id} className={cn("border-b border-slate-50 hover:bg-slate-50", overdue && "bg-red-50/30")}>
                    <td className="px-4 py-3">
                      <Link href={`/shop/repair-orders/${ro.id}`} className="font-mono text-blue-600 font-bold hover:underline">
                        #{ro.roNumber}
                      </Link>
                      {ro.isComeback && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">{t.ro.comeback}</span>}
                    </td>
                    <td className="px-4 py-3">{ro.customer.firstName} {ro.customer.lastName}</td>
                    <td className="px-4 py-3 text-slate-500">{ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", STATUS_STYLES[ro.status])}>
                        {statusLabel(ro.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{ro.writer?.name || "—"}</td>
                    <td className={cn("px-4 py-3 text-xs", overdue ? "text-red-500 font-medium" : "text-slate-500")}>
                      {ro.promisedAt
                        ? new Date(ro.promisedAt).toLocaleDateString(locale === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric" })
                        : "—"}
                      {overdue && " ⚠"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(ro.grandTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
