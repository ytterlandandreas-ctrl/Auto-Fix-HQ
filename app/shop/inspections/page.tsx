import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Eye, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default async function InspectionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const sp = await searchParams;
  const statusFilter = sp.status;

  const where: any = { shopId };
  if (statusFilter) where.status = statusFilter;

  const inspections = await db.digitalInspection.findMany({
    where,
    include: {
      repairOrder: {
        select: {
          id: true, roNumber: true,
          vehicle: { select: { year: true, make: true, model: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
      },
      technician: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const STATUS_COLORS: Record<string, string> = {
    in_progress: "bg-yellow-100 text-yellow-700",
    sent: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-600",
    partially_approved: "bg-amber-100 text-amber-700",
  };

  const STATUS_ICONS: Record<string, any> = {
    in_progress: Clock,
    sent: Eye,
    approved: CheckCircle,
    declined: XCircle,
    partially_approved: AlertTriangle,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Digital Inspections</h1>
          <p className="text-sm text-slate-500">{inspections.length} inspections</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { label: "All", val: undefined },
          { label: "In Progress", val: "in_progress" },
          { label: "Sent", val: "sent" },
          { label: "Approved", val: "approved" },
          { label: "Declined", val: "declined" },
        ].map((tab) => (
          <Link key={tab.label} href={`/shop/inspections${tab.val ? `?status=${tab.val}` : ""}`}>
            <button className={cn("px-3 py-1.5 text-sm rounded-lg font-medium",
              statusFilter === tab.val ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}>
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Inspection</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Vehicle</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Technician</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Items</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Created</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((insp) => {
              const Icon = STATUS_ICONS[insp.status];
              return (
                <tr key={insp.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/shop/inspections/${insp.id}`} className="font-medium text-blue-600 hover:underline">
                      RO #{insp.repairOrder.roNumber} — Inspection
                    </Link>
                    <p className="text-xs text-slate-500">{insp.repairOrder.customer.firstName} {insp.repairOrder.customer.lastName}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {insp.repairOrder.vehicle.year} {insp.repairOrder.vehicle.make} {insp.repairOrder.vehicle.model}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{insp.technician?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{insp._count.items}</td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[insp.status])}>
                      {Icon && <Icon className="w-3 h-3" />}
                      {insp.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs">
                    {new Date(insp.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {inspections.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No inspections yet — start one from a repair order</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
