"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Car } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function CustomersClient({ customers, q }: { customers: any[]; q?: string }) {
  const { t, formatCurrency, formatDate } = useLocale();

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.customers.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500">{customers.length} {t.customers.title.toLowerCase()}</p>
        </div>
        <Link href="/shop/customers/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm shrink-0">+ {t.customers.newCustomer}</Button>
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t.customers.searchPlaceholder}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button type="submit" variant="outline" size="sm" className="shrink-0">{t.common.search}</Button>
      </form>

      {/* Mobile: card stack */}
      <div className="md:hidden space-y-2">
        {customers.map((c) => (
          <Link key={c.id} href={`/shop/customers/${c.id}`}
            className="block bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 text-sm">{c.firstName} {c.lastName}</p>
                {c.email && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {c.phone}
                </p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-semibold text-slate-800 text-sm">{formatCurrency(c.totalSpent)}</p>
                <p className="text-xs text-slate-400">{c._count.repairOrders} {t.customers.ros}</p>
              </div>
            </div>
            {c.vehicles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {c.vehicles.slice(0, 2).map((v: any) => (
                  <span key={v.id} className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Car className="w-2.5 h-2.5" /> {v.year} {v.make} {v.model}
                  </span>
                ))}
                {c.vehicles.length > 2 && (
                  <span className="text-xs text-slate-400">+{c.vehicles.length - 2} {t.customers.moreVehicles}</span>
                )}
              </div>
            )}
          </Link>
        ))}
        {customers.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            {t.customers.noCustomers}
          </div>
        )}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left px-5 py-3 font-medium text-slate-500">{t.ro.customer}</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">{t.common.phone}</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">{t.customers.vehicles}</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">{t.customers.ros}</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">{t.customers.totalSpent}</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">{t.customers.lastVisit}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/shop/customers/${c.id}`} className="font-medium text-blue-600 hover:underline">
                      {c.firstName} {c.lastName}
                    </Link>
                    {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Phone className="w-3.5 h-3.5" /> {c.phone}
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      {c.vehicles.slice(0, 2).map((v: any) => (
                        <span key={v.id} className="text-xs text-slate-500 flex items-center gap-1">
                          <Car className="w-3 h-3" /> {v.year} {v.make} {v.model}
                        </span>
                      ))}
                      {c.vehicles.length > 2 && (
                        <span className="text-xs text-slate-400">+{c.vehicles.length - 2} {t.customers.moreVehicles}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">{c._count.repairOrders}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">{formatCurrency(c.totalSpent)}</td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs">
                    {c.lastVisitAt ? formatDate(c.lastVisitAt) : t.common.never}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    {t.customers.noCustomers}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
