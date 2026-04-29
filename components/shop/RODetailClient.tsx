"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROStatus, LineItemType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  ClipboardList, Car, User, FileText, Camera, Clock, MessageSquare,
  Plus, Trash2, Send, ChevronDown, AlertTriangle, CheckCircle,
} from "lucide-react";
import Link from "next/link";

const STATUS_ORDER: ROStatus[] = [
  "estimate", "approved", "in_progress", "qc", "completed", "invoiced", "paid",
];
const STATUS_COLORS: Record<ROStatus, string> = {
  estimate: "bg-slate-100 text-slate-700", approved: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-800", qc: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700", invoiced: "bg-orange-100 text-orange-700",
  paid: "bg-green-200 text-green-900", cancelled: "bg-red-100 text-red-700",
};

export function RODetailClient({ ro, users, cannedJobs, currentUserId, currentUserRole }: {
  ro: any; users: any[]; cannedJobs: any[];
  currentUserId: string; currentUserRole: string;
}) {
  const { t, formatCurrency } = useLocale();

  const STATUS_LABELS: Record<ROStatus, string> = {
    estimate: t.ro.statusEstimate,
    approved: t.ro.statusApproved,
    in_progress: t.ro.statusInProgress,
    qc: t.ro.statusQC,
    completed: t.common.success,
    invoiced: t.ro.statusInvoiced,
    paid: t.ro.statusPaid,
    cancelled: t.ro.statusCancelled,
  };

  const [status, setStatus] = useState<ROStatus>(ro.status);
  const [lineItems, setLineItems] = useState<any[]>(ro.lineItems);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [sendingSMS, setSendingSMS] = useState(false);

  const isEditable = !["paid", "cancelled"].includes(status);
  const currentIdx = STATUS_ORDER.indexOf(status);

  async function updateStatus(newStatus: ROStatus) {
    setSaving(true);
    const res = await fetch(`/api/repair-orders/${ro.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    if (res.ok) {
      setStatus(newStatus);
      toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
    } else {
      toast.error("Failed to update status");
    }
  }

  async function addLineItem(type: LineItemType) {
    const newItem = {
      id: `temp-${Date.now()}`,
      type,
      description: "",
      quantity: 1,
      unitPrice: 0,
      laborHours: type === "labor" ? 1 : undefined,
      isTaxable: true,
      isNew: true,
    };
    setLineItems([...lineItems, newItem]);
  }

  async function saveLineItems() {
    setSaving(true);
    const res = await fetch(`/api/repair-orders/${ro.id}/line-items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineItems: lineItems.filter((i) => !i.isNew || i.description) }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Line items saved");
    } else {
      toast.error("Save failed");
    }
  }

  async function sendInspectionSMS() {
    setSendingSMS(true);
    const res = await fetch(`/api/repair-orders/${ro.id}/send-inspection`, { method: "POST" });
    setSendingSMS(false);
    if (res.ok) toast.success("Inspection SMS sent to customer");
    else toast.error("Failed to send SMS");
  }

  async function createInvoice() {
    setSaving(true);
    const res = await fetch(`/api/repair-orders/${ro.id}/invoice`, { method: "POST" });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      toast.success("Invoice created");
      window.location.href = `/shop/invoices/${data.invoiceId}`;
    } else {
      toast.error("Failed to create invoice");
    }
  }

  const labor = lineItems.filter((i) => i.type === "labor").reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const parts = lineItems.filter((i) => i.type === "part").reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const sublet = lineItems.filter((i) => i.type === "sublet").reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const fees = lineItems.filter((i) => i.type === "fee").reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const subtotal = labor + parts + sublet + fees;
  const tax = subtotal * (ro.taxRate || 0) / 100;
  const total = subtotal + tax;

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">RO #{ro.roNumber}</h1>
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium", STATUS_COLORS[status])}>
              {STATUS_LABELS[status]}
            </span>
            {ro.isComeback && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Comeback
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Created {new Date(ro.createdAt).toLocaleDateString()}
            {ro.promisedAt && ` · Promise: ${new Date(ro.promisedAt).toLocaleString()}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status progression */}
          {isEditable && currentIdx < STATUS_ORDER.length - 1 && (
            <Button
              onClick={() => updateStatus(STATUS_ORDER[currentIdx + 1])}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              Move to {STATUS_LABELS[STATUS_ORDER[currentIdx + 1]]}
            </Button>
          )}
          {status === "completed" && !ro.invoice && (
            <Button onClick={createInvoice} className="bg-green-600 hover:bg-green-700" disabled={saving}>
              Create Invoice
            </Button>
          )}
          {ro.inspection && (
            <Button variant="outline" onClick={sendInspectionSMS} disabled={sendingSMS}>
              <Send className="w-4 h-4 mr-2" />
              {sendingSMS ? t.common.sending : t.ro.sendInspection}
            </Button>
          )}
        </div>
      </div>

      {/* Customer + Vehicle info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard icon={User} title={t.ro.customer}>
          <p className="font-semibold">{ro.customer.firstName} {ro.customer.lastName}</p>
          <p className="text-slate-500">{ro.customer.phone}</p>
          <p className="text-slate-500">{ro.customer.email}</p>
          <Link href={`/shop/customers/${ro.customer.id}`} className="text-blue-600 text-xs hover:underline mt-1 inline-block">
            View customer →
          </Link>
        </InfoCard>
        <InfoCard icon={Car} title={t.ro.vehicle}>
          <p className="font-semibold">{ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}</p>
          {ro.vehicle.vin && <p className="text-slate-500 text-xs font-mono">{ro.vehicle.vin}</p>}
          <p className="text-slate-500">
            {ro.mileageIn ? `In: ${ro.mileageIn.toLocaleString()} mi` : "Mileage not set"}
            {ro.mileageOut ? ` · Out: ${ro.mileageOut.toLocaleString()} mi` : ""}
          </p>
          {ro.vehicle.color && <p className="text-slate-400 text-sm">{ro.vehicle.color}</p>}
        </InfoCard>
        <InfoCard icon={ClipboardList} title={t.ro.complaint}>
          <p className="text-slate-700">{ro.customerConcern || "No customer concern noted"}</p>
          {ro.techNotes && <p className="mt-2 text-slate-500 text-sm italic">Tech notes: {ro.techNotes}</p>}
        </InfoCard>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="lineitems">
        <TabsList className="bg-slate-100 overflow-x-auto">
          <TabsTrigger value="lineitems">
            <FileText className="w-4 h-4 mr-2" /> {t.ro.tabLineItems}
          </TabsTrigger>
          <TabsTrigger value="inspection">
            <Camera className="w-4 h-4 mr-2" /> {t.ro.tabInspection}
          </TabsTrigger>
          <TabsTrigger value="timeclock">
            <Clock className="w-4 h-4 mr-2" /> {t.ro.tabTimeClock}
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" /> {t.ro.tabMessages}
          </TabsTrigger>
        </TabsList>

        {/* LINE ITEMS */}
        <TabsContent value="lineitems" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-slate-500 w-16">{t.ro.type}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">{t.ro.description}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 w-20">{t.ro.qty}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 w-28">{t.ro.unitPrice}</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500 w-28">{t.common.total}</th>
                  {isEditable && <th className="w-10 px-2" />}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="px-4 py-2">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                        item.type === "labor" ? "bg-blue-50 text-blue-700" :
                        item.type === "part" ? "bg-green-50 text-green-700" :
                        item.type === "sublet" ? "bg-orange-50 text-orange-700" :
                        "bg-slate-50 text-slate-700"
                      )}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {isEditable ? (
                        <input
                          className="w-full bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx] = { ...item, description: e.target.value };
                            setLineItems(updated);
                          }}
                          placeholder={`${t.ro.description}...`}
                        />
                      ) : (
                        <span>{item.description}</span>
                      )}
                      {item.laborTimeGuide && (
                        <span className="text-xs text-slate-400 ml-2">(Guide: {item.laborTimeGuide}h)</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditable ? (
                        <input
                          type="number"
                          step="0.1"
                          className="w-20 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 text-right"
                          value={item.type === "labor" ? item.laborHours ?? item.quantity : item.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...lineItems];
                            updated[idx] = item.type === "labor"
                              ? { ...item, laborHours: val, quantity: val }
                              : { ...item, quantity: val };
                            setLineItems(updated);
                          }}
                        />
                      ) : (
                        <span className="text-right block">
                          {item.type === "labor" ? `${item.laborHours ?? item.quantity}h` : item.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditable ? (
                        <input
                          type="number"
                          step="0.01"
                          className="w-28 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 text-right"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx] = { ...item, unitPrice: parseFloat(e.target.value) || 0 };
                            setLineItems(updated);
                          }}
                        />
                      ) : (
                        <span className="text-right block">{formatCurrency(item.unitPrice)}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                    {isEditable && (
                      <td className="px-2 py-2">
                        <button
                          onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {isEditable && (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => addLineItem("labor")}>
                  <Plus className="w-3 h-3 mr-1" /> Labor
                </Button>
                <Button size="sm" variant="outline" onClick={() => addLineItem("part")}>
                  <Plus className="w-3 h-3 mr-1" /> Part
                </Button>
                <Button size="sm" variant="outline" onClick={() => addLineItem("sublet")}>
                  <Plus className="w-3 h-3 mr-1" /> Sublet
                </Button>
                <Button size="sm" variant="outline" onClick={() => addLineItem("fee")}>
                  <Plus className="w-3 h-3 mr-1" /> Fee
                </Button>
                <Button size="sm" onClick={saveLineItems} className="ml-auto bg-blue-600 hover:bg-blue-700" disabled={saving}>
                  {saving ? t.common.saving : t.common.save}
                </Button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="bg-white border border-slate-200 rounded-xl p-5 w-72 space-y-2 text-sm">
              <TotalRow label={t.ro.labor} value={labor} formatCurrency={formatCurrency} />
              <TotalRow label={t.ro.parts} value={parts} formatCurrency={formatCurrency} />
              {sublet > 0 && <TotalRow label={t.ro.sublet} value={sublet} formatCurrency={formatCurrency} />}
              {fees > 0 && <TotalRow label={t.ro.fees} value={fees} formatCurrency={formatCurrency} />}
              <div className="border-t border-slate-100 pt-2">
                <TotalRow label={t.common.total} value={subtotal} formatCurrency={formatCurrency} />
                <TotalRow label={`${t.ro.tax} (${ro.taxRate || 0}%)`} value={tax} formatCurrency={formatCurrency} />
              </div>
              <div className="border-t border-slate-200 pt-2">
                <TotalRow label={t.ro.grandTotal} value={total} bold formatCurrency={formatCurrency} />
              </div>
              {ro.paidAmount > 0 && (
                <TotalRow label={t.docs.paid} value={-ro.paidAmount} className="text-green-600" formatCurrency={formatCurrency} />
              )}
            </div>
          </div>
        </TabsContent>

        {/* INSPECTION */}
        <TabsContent value="inspection">
          {ro.inspection ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("px-3 py-1 rounded-full text-sm font-medium",
                    ro.inspection.status === "approved" ? "bg-green-100 text-green-700" :
                    ro.inspection.status === "sent" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-700"
                  )}>
                    {ro.inspection.status}
                  </span>
                  <span className="text-sm text-slate-500">
                    {ro.inspection.items.length} inspection items
                  </span>
                </div>
                <Link href={`/shop/inspections/${ro.inspection.id}`}>
                  <Button variant="outline" size="sm">Open Full Inspection</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ro.inspection.items.slice(0, 6).map((item: any) => (
                  <div key={item.id} className={cn("bg-white border rounded-lg p-3 flex items-center gap-3",
                    item.condition === "critical" ? "border-red-200 bg-red-50" :
                    item.condition === "needs_attention" ? "border-yellow-200 bg-yellow-50" : "border-slate-200"
                  )}>
                    {item.condition === "ok" ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className={cn("w-5 h-5 flex-shrink-0",
                        item.condition === "critical" ? "text-red-500" : "text-yellow-500"
                      )} />
                    )}
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.category} · {item.decision}</p>
                      {item.estimatedCost && (
                        <p className="text-xs font-medium text-slate-700">{formatCurrency(item.estimatedCost)}</p>
                      )}
                    </div>
                    {item.media.length > 0 && (
                      <img
                        src={item.media[0].url}
                        alt={item.name}
                        className="ml-auto w-12 h-12 object-cover rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
              <Camera className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No inspection started yet</p>
              <Link href={`/shop/inspections/new?roId=${ro.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700">Start Inspection</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* TIME CLOCK */}
        <TabsContent value="timeclock">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">{t.appointments.technician}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">{t.technicians.clockIn}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">{t.technicians.clockOut}</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {ro.techClocks.map((tc: any) => {
                  const mins = tc.clockedOutAt
                    ? Math.round((new Date(tc.clockedOutAt).getTime() - new Date(tc.clockedInAt).getTime()) / 60000)
                    : Math.round((Date.now() - new Date(tc.clockedInAt).getTime()) / 60000);
                  return (
                    <tr key={tc.id} className="border-b border-slate-50">
                      <td className="px-4 py-3 font-medium">{tc.technician.name}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(tc.clockedInAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {tc.clockedOutAt ? new Date(tc.clockedOutAt).toLocaleString() : (
                          <span className="text-green-600 font-medium">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {Math.floor(mins / 60)}h {mins % 60}m
                      </td>
                    </tr>
                  );
                })}
                {ro.techClocks.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">{t.common.noResults}</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </TabsContent>

        {/* MESSAGES */}
        <TabsContent value="messages">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ro.messages.map((msg: any) => (
                <div key={msg.id} className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-xs rounded-xl px-3 py-2 text-sm",
                    msg.direction === "outbound" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
                  )}>
                    <p>{msg.body}</p>
                    <p className={cn("text-xs mt-1", msg.direction === "outbound" ? "text-blue-200" : "text-slate-400")}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {ro.messages.length === 0 && (
                <p className="text-slate-400 text-center py-4">No messages yet</p>
              )}
            </div>
            <div className="flex gap-2 border-t pt-3">
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t.comms.smsPlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && note.trim()) {
                    const body = note;
                    setNote("");
                    const res = await fetch(`/api/repair-orders/${ro.id}/message`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ body }),
                    });
                    if (res.ok) toast.success("Message sent");
                    else toast.error("Failed to send");
                  }
                }}
              />
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function TotalRow({ label, value, bold, className, formatCurrency }: { label: string; value: number; bold?: boolean; className?: string; formatCurrency: (n: number) => string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <span className={cn("text-slate-500", bold && "font-bold text-slate-900")}>{label}</span>
      <span className={cn(bold ? "font-bold text-slate-900 text-base" : "text-slate-700")}>
        {value < 0 ? `-${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
      </span>
    </div>
  );
}
