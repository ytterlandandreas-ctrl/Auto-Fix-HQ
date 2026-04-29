"use client";

import type { ROStatus } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Clock, User, AlertTriangle } from "lucide-react";

type RO = {
  id: string;
  roNumber: string;
  status: ROStatus;
  grandTotal: number;
  isComeback: boolean;
  promisedAt: Date | null;
  customer: { firstName: string; lastName: string };
  vehicle: { year: number; make: string; model: string };
  writer: { name: string } | null;
  techClocks: { technician: { name: string } }[];
};

export function ROKanban({ ros }: { ros: RO[] }) {
  const { t } = useLocale();

  const COLUMNS: { status: ROStatus; label: string; color: string }[] = [
    { status: "estimate", label: t.ro.statusEstimate, color: "border-slate-300" },
    { status: "approved", label: t.ro.statusApproved, color: "border-blue-400" },
    { status: "in_progress", label: t.ro.statusInProgress, color: "border-yellow-400" },
    { status: "qc", label: t.ro.statusQC, color: "border-purple-400" },
    { status: "completed", label: t.common.success, color: "border-green-400" },
    { status: "invoiced", label: t.ro.statusInvoiced, color: "border-orange-400" },
  ];

  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = ros.filter((ro) => ro.status === col.status);
    return acc;
  }, {} as Record<ROStatus, RO[]>);

  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0">
      {COLUMNS.map((col) => {
        const colROs = byStatus[col.status] || [];
        return (
          <div key={col.status} className="flex-shrink-0 w-60 sm:w-64">
            <div className={cn("border-t-4 rounded-t-sm mb-3", col.color)} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">{col.label}</span>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {colROs.length}
              </span>
            </div>
            <div className="space-y-2">
              {colROs.map((ro) => (
                <ROCard key={ro.id} ro={ro} />
              ))}
              {colROs.length === 0 && (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-xs text-slate-400">
                  —
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ROCard({ ro }: { ro: RO }) {
  const { t, formatCurrency, locale } = useLocale();
  const isOverdue =
    ro.promisedAt && ro.promisedAt < new Date() &&
    ["approved", "in_progress"].includes(ro.status);
  const activeTech = ro.techClocks[0]?.technician?.name;

  return (
    <Link href={`/shop/repair-orders/${ro.id}`}>
      <div
        className={cn(
          "bg-white border rounded-lg p-3 space-y-2 hover:shadow-md transition-shadow cursor-pointer",
          isOverdue ? "border-red-300 bg-red-50" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-blue-600">#{ro.roNumber}</span>
          {ro.isComeback && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{t.ro.comeback}</span>
          )}
          {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
        </div>
        <p className="text-sm font-medium text-slate-800">
          {ro.customer.firstName} {ro.customer.lastName}
        </p>
        <p className="text-xs text-slate-500">
          {ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">{formatCurrency(ro.grandTotal)}</span>
          {activeTech && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <User className="w-3 h-3" /> {activeTech.split(" ")[0]}
            </span>
          )}
        </div>
        {ro.promisedAt && (
          <div className={cn("flex items-center gap-1 text-xs", isOverdue ? "text-red-500" : "text-slate-400")}>
            <Clock className="w-3 h-3" />
            {new Date(ro.promisedAt).toLocaleDateString(locale === "es" ? "es-MX" : "en-US",
              { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </div>
        )}
      </div>
    </Link>
  );
}
