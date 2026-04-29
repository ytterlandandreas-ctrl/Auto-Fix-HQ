"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle, Phone, Wrench } from "lucide-react";

const CONDITION_LABELS = { ok: "Good", needs_attention: "Needs Attention", critical: "Critical" };
const CONDITION_COLORS = {
  ok: "border-green-200 bg-green-50",
  needs_attention: "border-yellow-200 bg-yellow-50",
  critical: "border-red-200 bg-red-50",
};
const CONDITION_ICONS = {
  ok: <CheckCircle className="w-5 h-5 text-green-500" />,
  needs_attention: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  critical: <XCircle className="w-5 h-5 text-red-500" />,
};

export function InspectionPortalClient({ inspection, shop }: { inspection: any; shop: any }) {
  const [decisions, setDecisions] = useState<Record<string, "approved" | "declined" | "pending">>(
    Object.fromEntries(inspection.items.map((i: any) => [i.id, i.decision]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(["approved", "declined"].includes(inspection.status));

  const needsAttentionItems = inspection.items.filter(
    (i: any) => i.condition !== "ok"
  );

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch(`/api/portal/inspection/${inspection.token}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisions }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      toast.success("Your responses have been submitted. The shop will contact you shortly.");
    } else {
      toast.error("Submission failed. Please try again.");
    }
  }

  const approvedCount = Object.values(decisions).filter((d) => d === "approved").length;
  const declinedCount = Object.values(decisions).filter((d) => d === "declined").length;
  const pendingCount = needsAttentionItems.filter((i: any) => decisions[i.id] === "pending").length;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Thank You!</h1>
          <p className="text-slate-600">
            Your responses have been received. {shop.name} will contact you to schedule any approved work.
          </p>
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="inline-flex items-center gap-2 text-blue-600 font-medium">
              <Phone className="w-4 h-4" /> Call {shop.name}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{shop.name}</p>
              <p className="text-xs text-slate-500">Vehicle Inspection Report</p>
            </div>
          </div>
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
              <Phone className="w-4 h-4" /> Call Us
            </a>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Vehicle info */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Vehicle</p>
          <p className="text-lg font-bold text-slate-900">
            {inspection.repairOrder.vehicle.year} {inspection.repairOrder.vehicle.make} {inspection.repairOrder.vehicle.model}
          </p>
          <p className="text-slate-500">
            {inspection.repairOrder.customer.firstName} {inspection.repairOrder.customer.lastName}
          </p>
        </div>

        {/* Good items summary */}
        {inspection.items.filter((i: any) => i.condition === "ok").length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">
                {inspection.items.filter((i: any) => i.condition === "ok").length} items in good condition
              </span>
            </div>
            <p className="text-sm text-green-700">
              {inspection.items.filter((i: any) => i.condition === "ok").map((i: any) => i.name).join(", ")}
            </p>
          </div>
        )}

        {/* Items needing attention */}
        {needsAttentionItems.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              Items Needing Attention ({needsAttentionItems.length})
            </h2>
            <div className="space-y-3">
              {needsAttentionItems.map((item: any) => (
                <div
                  key={item.id}
                  className={cn("bg-white rounded-xl border-2 overflow-hidden", CONDITION_COLORS[item.condition as keyof typeof CONDITION_COLORS])}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {CONDITION_ICONS[item.condition as keyof typeof CONDITION_ICONS]}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                            item.condition === "critical" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                          )}>
                            {CONDITION_LABELS[item.condition as keyof typeof CONDITION_LABELS]}
                          </span>
                        </div>
                        {item.techNotes && (
                          <p className="text-sm text-slate-600 mt-1">{item.techNotes}</p>
                        )}
                        {item.estimatedCost && inspection.showPricing && (
                          <p className="text-sm font-semibold text-slate-800 mt-1">
                            Estimated: {formatCurrency(item.estimatedCost)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Photos */}
                    {item.media.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {item.media.map((m: any) => (
                          <img
                            key={m.id}
                            src={m.url}
                            alt={m.caption || item.name}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    {/* Approve/Decline buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setDecisions((d) => ({ ...d, [item.id]: "approved" }))}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors border-2",
                          decisions[item.id] === "approved"
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-green-700 border-green-300 hover:bg-green-50"
                        )}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setDecisions((d) => ({ ...d, [item.id]: "declined" }))}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors border-2",
                          decisions[item.id] === "declined"
                            ? "bg-slate-600 text-white border-slate-600"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary + Submit */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Approved</span>
            <span className="font-semibold text-green-600">{approvedCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Declined</span>
            <span className="font-semibold text-slate-600">{declinedCount}</span>
          </div>
          {pendingCount > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              {pendingCount} item{pendingCount > 1 ? "s" : ""} still need your decision
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting || pendingCount > 0}
            className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-base"
          >
            {submitting ? "Submitting..." : "Submit My Responses"}
          </Button>
          <p className="text-xs text-center text-slate-400">
            Your responses go directly to {shop.name}
          </p>
        </div>
      </div>
    </div>
  );
}
