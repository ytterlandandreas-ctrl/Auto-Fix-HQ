"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List } from "lucide-react";
import { ROKanban } from "@/components/shop/ROKanban";
import { ROListTable } from "@/components/shop/ROListTable";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function RepairOrdersClient({ ros, view, filter, q }: {
  ros: any[]; view: string; filter?: string; q?: string;
}) {
  const { t } = useLocale();

  const tabs = [
    { label: t.ro.filterAll, filter: undefined },
    { label: t.ro.filterOpen, filter: "open" },
    { label: t.ro.filterOverdue, filter: "overdue" },
    { label: t.ro.filterComebacks, filter: "comeback" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.ro.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500">{ros.length} {t.ro.title.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Link href={`/shop/repair-orders?view=kanban${filter ? `&filter=${filter}` : ""}`}>
            <Button variant={view === "kanban" ? "default" : "outline"} size="sm" aria-label={t.ro.kanbanView}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/shop/repair-orders?view=list${filter ? `&filter=${filter}` : ""}`}>
            <Button variant={view === "list" ? "default" : "outline"} size="sm" aria-label={t.ro.listView}>
              <List className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/shop/repair-orders/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{t.ro.newRO}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t.customers.searchPlaceholder}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {view && <input type="hidden" name="view" value={view} />}
        <Button type="submit" variant="outline" size="sm" className="shrink-0">{t.common.search}</Button>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={`/shop/repair-orders?view=${view}${tab.filter ? `&filter=${tab.filter}` : ""}`}
          >
            <Button
              variant={filter === tab.filter ? "default" : "outline"}
              size="sm"
              className={`shrink-0 ${filter === tab.filter ? "bg-blue-600" : ""}`}
            >
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {view === "kanban" ? <ROKanban ros={ros} /> : <ROListTable ros={ros} />}
    </div>
  );
}
