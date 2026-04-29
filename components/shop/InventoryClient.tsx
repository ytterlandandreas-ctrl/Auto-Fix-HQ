"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Package, Upload, AlertTriangle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function InventoryClient({ items, lowCount, filter, q }: {
  items: any[]; lowCount: number; filter?: string; q?: string;
}) {
  const { t, formatCurrency, interpolate } = useLocale();
  const [showNew, setShowNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    partNumber: "", description: "", brand: "", category: "",
    quantityOnHand: "0", reorderPoint: "0", reorderQty: "0",
    costPrice: "0", retailPrice: "0", location: "",
  });

  async function handleBulkImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/inventory", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setImportResult(data);
      toast.success(interpolate(t.inventory.importedToast, { imported: data.imported, skipped: data.skipped }));
      router.refresh();
    } else {
      toast.error(t.common.error);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantityOnHand: parseFloat(form.quantityOnHand),
        reorderPoint: parseFloat(form.reorderPoint),
        reorderQty: parseFloat(form.reorderQty),
        costPrice: parseFloat(form.costPrice),
        retailPrice: parseFloat(form.retailPrice),
      }),
    });
    if (res.ok) {
      toast.success(t.inventory.partAdded);
      setShowNew(false);
      router.refresh();
    } else {
      toast.error(t.inventory.addFailed);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.inventory.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500">{items.length} {t.inventory.items}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lowCount > 0 && (
            <a href="/shop/inventory?filter=low">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm bg-amber-50 text-amber-700 border border-amber-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-medium">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {lowCount} {t.inventory.lowStock}
              </span>
            </a>
          )}
          <input type="file" accept=".csv" ref={fileRef} onChange={handleBulkImport} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{uploading ? t.inventory.importing : t.inventory.importCSV}</span>
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.inventory.addPart}</span>
          </Button>
        </div>
      </div>

      {/* CSV format hint */}
      <p className="text-xs text-slate-400 hidden sm:block">
        {t.inventory.csvHint} <code className="bg-slate-100 px-1 rounded">partNumber, description, brand, category, quantityOnHand, reorderPoint, reorderQty, costPrice, retailPrice</code>
      </p>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input name="q" defaultValue={q} placeholder={t.inventory.searchPlaceholder}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        {filter && <input type="hidden" name="filter" value={filter} />}
        <Button type="submit" variant="outline" size="sm" className="shrink-0">{t.common.search}</Button>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ label: t.inventory.filterAll, filter: undefined }, { label: t.inventory.filterLow, filter: "low" }].map((tab) => (
          <a key={tab.label} href={`/shop/inventory${tab.filter ? `?filter=${tab.filter}` : ""}`}>
            <Button variant={filter === tab.filter ? "default" : "outline"} size="sm"
              className={cn("shrink-0", filter === tab.filter ? "bg-blue-600" : "")}>
              {tab.label}
            </Button>
          </a>
        ))}
      </div>

      {/* New item form */}
      {showNew && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">{t.inventory.newPart}</h3>
            <button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={`${t.inventory.partNumber} *`} value={form.partNumber} onChange={(v) => setForm((f) => ({ ...f, partNumber: v }))} required />
            <Field label={`${t.inventory.description} *`} value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} required />
            <Field label={t.inventory.brand} value={form.brand} onChange={(v) => setForm((f) => ({ ...f, brand: v }))} />
            <Field label={t.inventory.category} value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
            <Field label={t.inventory.qtyOnHand} value={form.quantityOnHand} onChange={(v) => setForm((f) => ({ ...f, quantityOnHand: v }))} type="number" />
            <Field label={t.inventory.reorderPoint} value={form.reorderPoint} onChange={(v) => setForm((f) => ({ ...f, reorderPoint: v }))} type="number" />
            <Field label={t.inventory.costPrice} value={form.costPrice} onChange={(v) => setForm((f) => ({ ...f, costPrice: v }))} type="number" />
            <Field label={t.inventory.retailPrice} value={form.retailPrice} onChange={(v) => setForm((f) => ({ ...f, retailPrice: v }))} type="number" />
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>{t.common.cancel}</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{t.inventory.addPart}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {items.map((item) => {
          const isLow = item.quantityOnHand <= item.reorderPoint && item.reorderPoint > 0;
          return (
            <div key={item.id} className={cn("bg-white rounded-xl border border-slate-200 p-3", isLow && "bg-amber-50/30 border-amber-200")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 text-sm">{item.description}</p>
                  <p className="text-xs text-slate-400 font-mono">{item.partNumber}</p>
                  {item.brand && <p className="text-xs text-slate-500">{item.brand}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("font-bold text-lg", isLow ? "text-amber-600" : "text-slate-800")}>{item.quantityOnHand}</p>
                  <p className="text-xs text-slate-400">{t.inventory.onHand}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                <span>{t.inventory.cost}: <span className="text-slate-700">{formatCurrency(item.costPrice)}</span></span>
                <span>{t.inventory.retail}: <span className="font-medium text-slate-800">{formatCurrency(item.retailPrice)}</span></span>
              </div>
              {isLow && (
                <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                  <AlertTriangle className="w-3 h-3" /> {t.inventory.lowStock}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            {t.inventory.noPartsFound}
          </div>
        )}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium text-slate-500">{t.inventory.partNumber}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">{t.inventory.description}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">{t.inventory.brand}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">{t.inventory.onHand}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">{t.inventory.reorderAt}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">{t.inventory.cost}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">{t.inventory.retail}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = item.quantityOnHand <= item.reorderPoint && item.reorderPoint > 0;
                return (
                  <tr key={item.id} className={cn("border-b border-slate-50", isLow && "bg-amber-50/30")}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.partNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.description}
                      {isLow && <AlertTriangle className="inline w-3.5 h-3.5 text-amber-500 ml-2" />}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.brand || "—"}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold", isLow ? "text-amber-600" : "text-slate-800")}>
                      {item.quantityOnHand}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">{item.reorderPoint}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(item.costPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.retailPrice)}</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">{t.inventory.noPartsFound}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
