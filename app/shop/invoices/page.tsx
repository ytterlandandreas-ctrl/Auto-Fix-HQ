import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { ExternalLink, FileText } from "lucide-react";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const sp = await searchParams;
  const statusFilter = sp.status;

  const where: any = { shopId };
  if (statusFilter) where.status = statusFilter;

  const invoices = await db.invoice.findMany({
    where,
    include: {
      repairOrder: {
        select: {
          id: true, roNumber: true,
          customer: { select: { firstName: true, lastName: true } },
          vehicle: { select: { year: true, make: true, model: true } },
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    overdue: "bg-red-100 text-red-600",
    voided: "bg-slate-100 text-slate-400",
  };

  const totalAR = invoices.filter((i) => i.status !== "paid" && i.status !== "voided")
    .reduce((sum, i) => sum + (i.total - i.payments.reduce((s, p) => s + p.amount, 0)), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">{invoices.length} invoices · {formatCurrency(totalAR)} outstanding</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { label: "All", val: undefined },
          { label: "Sent", val: "sent" },
          { label: "Paid", val: "paid" },
          { label: "Overdue", val: "overdue" },
        ].map((tab) => (
          <Link key={tab.label} href={`/shop/invoices${tab.val ? `?status=${tab.val}` : ""}`}>
            <button className={cn("px-3 py-1.5 text-sm rounded-lg font-medium",
              statusFilter === tab.val ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"
            )}>{tab.label}</button>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Invoice</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Customer</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Total</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Paid</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Balance</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Date</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Portal</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
              const balance = inv.total - paid;
              return (
                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/shop/repair-orders/${inv.repairOrder.id}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> #{inv.invoiceNumber}
                    </Link>
                    <p className="text-xs text-slate-400">RO #{inv.repairOrder.roNumber}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {inv.repairOrder.customer.firstName} {inv.repairOrder.customer.lastName}
                  </td>
                  <td className="px-5 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                  <td className="px-5 py-3 text-right text-green-600">{formatCurrency(paid)}</td>
                  <td className={cn("px-5 py-3 text-right font-semibold", balance > 0 ? "text-red-600" : "text-slate-400")}>
                    {formatCurrency(balance)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[inv.status])}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <a href={`/portal/invoice/${inv.token}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">No invoices yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
