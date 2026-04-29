import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, MessageSquare, Car, Plus } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const { id } = await params;

  const customer = await db.customer.findFirst({
    where: { id, shopId },
    include: {
      vehicles: { orderBy: { year: "desc" } },
      repairOrders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { vehicle: { select: { year: true, make: true, model: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!customer) notFound();

  const totalROs = customer.repairOrders.length;
  const completedROs = customer.repairOrders.filter((r) => ["paid", "invoiced", "completed"].includes(r.status)).length;

  return (
    <div className="space-y-5">
      <Link href="/shop/customers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to customers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{customer.firstName} {customer.lastName}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
            <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-blue-600">
              <Phone className="w-3.5 h-3.5" /> {customer.phone}
            </a>
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-blue-600">
                <Mail className="w-3.5 h-3.5" /> {customer.email}
              </a>
            )}
            {!customer.smsOptIn && (
              <span className="text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">SMS opted out</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/shop/communications?customerId=${customer.id}`}>
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-1.5" /> Message
            </Button>
          </Link>
          <Link href="/shop/repair-orders/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1.5" /> New RO
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Spent</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(customer.totalSpent)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">ROs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalROs} <span className="text-sm font-normal text-slate-400">({completedROs} completed)</span></p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vehicles</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{customer.vehicles.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last Visit</p>
          <p className="text-base font-semibold text-slate-900 mt-1">
            {customer.lastVisitAt ? new Date(customer.lastVisitAt).toLocaleDateString() : "Never"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vehicles */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <h2 className="font-semibold text-slate-900 px-5 py-3 border-b border-slate-100">Vehicles</h2>
          <div className="divide-y divide-slate-50">
            {customer.vehicles.map((v) => (
              <div key={v.id} className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-slate-400" />
                  <p className="font-medium text-slate-800">{v.year} {v.make} {v.model}</p>
                </div>
                {v.vin && <p className="text-xs text-slate-400 mt-1 font-mono">VIN: {v.vin}</p>}
                {v.licensePlate && <p className="text-xs text-slate-400">Plate: {v.licensePlate}</p>}
                {v.mileage && <p className="text-xs text-slate-400">{v.mileage.toLocaleString()} miles</p>}
              </div>
            ))}
            {customer.vehicles.length === 0 && (
              <p className="px-5 py-6 text-center text-slate-400 text-sm">No vehicles on file</p>
            )}
          </div>
        </div>

        {/* RO history */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <h2 className="font-semibold text-slate-900 px-5 py-3 border-b border-slate-100">Repair Order History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-2 font-medium text-slate-500 text-xs">RO #</th>
                <th className="text-left px-5 py-2 font-medium text-slate-500 text-xs">Vehicle</th>
                <th className="text-left px-5 py-2 font-medium text-slate-500 text-xs">Status</th>
                <th className="text-right px-5 py-2 font-medium text-slate-500 text-xs">Total</th>
                <th className="text-right px-5 py-2 font-medium text-slate-500 text-xs">Date</th>
              </tr>
            </thead>
            <tbody>
              {customer.repairOrders.map((ro) => (
                <tr key={ro.id} className="border-b border-slate-50">
                  <td className="px-5 py-2.5">
                    <Link href={`/shop/repair-orders/${ro.id}`} className="font-mono text-blue-600 hover:underline">
                      #{ro.roNumber}
                    </Link>
                    {ro.isComeback && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">comeback</span>}
                  </td>
                  <td className="px-5 py-2.5 text-xs text-slate-600">
                    {ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full",
                      ro.status === "paid" ? "bg-green-100 text-green-700" :
                      ro.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {ro.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-medium">{formatCurrency(ro.grandTotal)}</td>
                  <td className="px-5 py-2.5 text-right text-slate-400 text-xs">
                    {new Date(ro.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {customer.repairOrders.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No repair orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
