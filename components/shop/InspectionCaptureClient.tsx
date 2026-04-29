"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Camera, Send, Check, AlertTriangle, X, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const CONDITIONS = [
  { value: "ok", label: "OK", color: "green", bg: "bg-green-50 border-green-200 text-green-700" },
  { value: "needs_attention", label: "Needs Attention", color: "yellow", bg: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  { value: "critical", label: "Critical", color: "red", bg: "bg-red-50 border-red-200 text-red-700" },
];

export function InspectionCaptureClient({ inspection }: { inspection: any }) {
  const router = useRouter();
  const [items, setItems] = useState(inspection.items);
  const [sending, setSending] = useState(false);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const grouped = items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  async function updateItem(itemId: string, updates: any) {
    setSavingItem(itemId);
    setItems((prev: any[]) => prev.map((i) => i.id === itemId ? { ...i, ...updates } : i));
    const res = await fetch(`/api/inspections/${inspection.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSavingItem(null);
    if (!res.ok) {
      toast.error("Failed to save");
      router.refresh();
    }
  }

  async function uploadPhoto(itemId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("inspectionItemId", itemId);
    const res = await fetch(`/api/inspections/${inspection.id}/media`, { method: "POST", body: fd });
    if (res.ok) {
      const media = await res.json();
      setItems((prev: any[]) => prev.map((i) => i.id === itemId ? { ...i, media: [...(i.media ?? []), media] } : i));
      toast.success("Photo uploaded");
    } else {
      toast.error("Upload failed");
    }
  }

  async function deleteMedia(itemId: string, mediaId: string) {
    const res = await fetch(`/api/inspections/${inspection.id}/media/${mediaId}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev: any[]) => prev.map((i) => i.id === itemId ? { ...i, media: i.media.filter((m: any) => m.id !== mediaId) } : i));
    }
  }

  async function sendToCustomer() {
    setSending(true);
    const res = await fetch(`/api/repair-orders/${inspection.repairOrderId}/send-inspection`, { method: "POST" });
    setSending(false);
    if (res.ok) {
      toast.success("Sent to customer");
      router.refresh();
    } else {
      toast.error("Failed to send");
    }
  }

  const okCount = items.filter((i: any) => i.condition === "ok").length;
  const attentionCount = items.filter((i: any) => i.condition === "needs_attention").length;
  const criticalCount = items.filter((i: any) => i.condition === "critical").length;
  const completedCount = items.filter((i: any) => i.condition).length;
  const progress = Math.round((completedCount / items.length) * 100);

  const isReadOnly = ["sent", "approved", "declined", "partially_approved"].includes(inspection.status);

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href={`/shop/repair-orders/${inspection.repairOrderId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to RO #{inspection.repairOrder.roNumber}
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Digital Vehicle Inspection</h1>
            <p className="text-sm text-slate-500 mt-1">
              {inspection.repairOrder.vehicle.year} {inspection.repairOrder.vehicle.make} {inspection.repairOrder.vehicle.model}
              {inspection.repairOrder.vehicle.mileage && ` · ${inspection.repairOrder.vehicle.mileage.toLocaleString()} miles`}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer: {inspection.repairOrder.customer.firstName} {inspection.repairOrder.customer.lastName}
            </p>
          </div>
          {!isReadOnly && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={sendToCustomer} disabled={sending || completedCount < items.length}>
              <Send className="w-4 h-4 mr-1.5" />
              {sending ? "Sending..." : "Send to Customer"}
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{completedCount} of {items.length} items completed</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Status counts */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-green-600 font-medium">OK</p>
            <p className="text-xl font-bold text-green-700">{okCount}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-yellow-600 font-medium">Attention</p>
            <p className="text-xl font-bold text-yellow-700">{attentionCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-red-600 font-medium">Critical</p>
            <p className="text-xl font-bold text-red-700">{criticalCount}</p>
          </div>
        </div>
      </div>

      {/* Items by category */}
      {Object.entries(grouped).map(([category, catItems]: [string, any]) => (
        <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <h2 className="font-semibold text-slate-900 px-5 py-3 border-b border-slate-100 capitalize">
            {category.replace("_", " ")}
          </h2>
          <div className="divide-y divide-slate-50">
            {catItems.map((item: any) => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.name}</p>
                    {item.notes && <p className="text-xs text-slate-500 mt-0.5 italic">"{item.notes}"</p>}

                    {/* Photos */}
                    {item.media?.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {item.media.map((m: any) => (
                          <div key={m.id} className="relative group">
                            <img src={m.url} alt="" className="w-16 h-16 object-cover rounded border border-slate-200" />
                            {!isReadOnly && (
                              <button onClick={() => deleteMedia(item.id, m.id)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommended fix info */}
                    {item.condition !== "ok" && (item.estimatedCost ?? 0) > 0 && (
                      <div className="mt-2 text-xs text-slate-600">
                        Estimated repair: <span className="font-semibold">{formatCurrency(item.estimatedCost)}</span>
                      </div>
                    )}
                  </div>

                  {/* Condition buttons */}
                  {!isReadOnly ? (
                    <div className="flex gap-1.5 shrink-0">
                      {CONDITIONS.map((c) => (
                        <button key={c.value} onClick={() => updateItem(item.id, { condition: c.value })}
                          className={cn("text-xs font-medium px-2.5 py-1 rounded border transition-all",
                            item.condition === c.value ? c.bg : "border-slate-200 text-slate-500 hover:border-slate-300"
                          )}>
                          {c.label}
                        </button>
                      ))}
                      <input type="file" accept="image/*" capture="environment"
                        ref={(el) => { fileInputs.current[item.id] = el; }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(item.id, f); }}
                        className="hidden" />
                      <button onClick={() => fileInputs.current[item.id]?.click()}
                        className="text-xs px-2.5 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className={cn("text-xs px-2.5 py-1 rounded font-medium border",
                      CONDITIONS.find((c) => c.value === item.condition)?.bg ?? "bg-slate-50 border-slate-200 text-slate-500"
                    )}>
                      {CONDITIONS.find((c) => c.value === item.condition)?.label ?? "Not inspected"}
                    </span>
                  )}
                </div>

                {/* Notes input for non-OK items */}
                {!isReadOnly && item.condition && item.condition !== "ok" && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <input type="text" placeholder="Notes / recommendations..."
                      defaultValue={item.notes ?? ""}
                      onBlur={(e) => updateItem(item.id, { notes: e.target.value })}
                      className="col-span-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" />
                    <input type="number" step="0.01" placeholder="Est. repair cost ($)"
                      defaultValue={item.estimatedCost ?? ""}
                      onBlur={(e) => updateItem(item.id, { estimatedCost: parseFloat(e.target.value) || 0 })}
                      className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
