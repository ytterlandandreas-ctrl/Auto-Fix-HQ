import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const sp = await searchParams;
  const q = sp.q;

  const where: any = { shopId };
  if (q) {
    where.OR = [
      { make: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { vin: { contains: q, mode: "insensitive" } },
      { licensePlate: { contains: q, mode: "insensitive" } },
    ];
  }

  const vehicles = await db.vehicle.findMany({
    where,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      _count: { select: { repairOrders: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vehicles</h1>
        <p className="text-sm text-slate-500">{vehicles.length} vehicles</p>
      </div>

      <form method="GET" className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search by make, model, VIN, or plate..."
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Search</button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Vehicle</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">VIN / Plate</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Customer</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Mileage</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">ROs</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-800">{v.year} {v.make} {v.model}</p>
                  {v.color && <p className="text-xs text-slate-400">{v.color}</p>}
                </td>
                <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                  {v.vin || "—"}
                  {v.licensePlate && <p>Plate: {v.licensePlate}</p>}
                </td>
                <td className="px-5 py-3">
                  <Link href={`/shop/customers/${v.customer.id}`} className="text-blue-600 hover:underline">
                    {v.customer.firstName} {v.customer.lastName}
                  </Link>
                  <p className="text-xs text-slate-400">{v.customer.phone}</p>
                </td>
                <td className="px-5 py-3 text-right text-slate-500">
                  {v.mileage ? v.mileage.toLocaleString() : "—"}
                </td>
                <td className="px-5 py-3 text-right text-slate-600">{v._count.repairOrders}</td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No vehicles found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
