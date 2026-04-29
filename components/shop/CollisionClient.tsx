"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Plus, X, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  pending_estimate: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  supplement_requested: "bg-orange-100 text-orange-700",
  supplement_approved: "bg-emerald-100 text-emerald-700",
  paid: "bg-slate-100 text-slate-600",
  closed: "bg-slate-100 text-slate-500",
};

const SUPPLEMENT_STATUSES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-600",
};

export function CollisionClient({ claims, insurers, shopId }: {
  claims: any[];
  insurers: any[];
  shopId: string;
}) {
  const { t, formatCurrency } = useLocale();
  const router = useRouter();

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      open: t.collision.statusOpen,
      pending_estimate: t.collision.statusPendingEstimate,
      approved: t.collision.statusApproved,
      supplement_requested: t.collision.statusSupplementRequested,
      supplement_approved: t.collision.statusSupplementApproved,
      paid: t.collision.statusPaid,
      closed: t.collision.statusClosed,
    };
    return map[s] ?? s.replace(/_/g, " ");
  };
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showNewInsurer, setShowNewInsurer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claimForm, setClaimForm] = useState({
    claimNumber: "", insuranceCompanyId: "", adjusterName: "", adjusterPhone: "",
    adjusterEmail: "", coverageType: "collision", deductible: "0", roId: "",
  });
  const [insurerForm, setInsurerForm] = useState({ name: "", phone: "", email: "", address: "" });

  async function createClaim(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/collision/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...claimForm, deductible: parseFloat(claimForm.deductible) }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t.common.success);
      setShowNewClaim(false);
      router.refresh();
    } else {
      toast.error(t.common.error);
    }
  }

  async function createInsurer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/collision/insurers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(insurerForm),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t.common.success);
      setShowNewInsurer(false);
      router.refresh();
    } else {
      toast.error(t.common.error);
    }
  }

  async function addSupplement(claimId: string) {
    const description = prompt(t.collision.supplements + ":");
    if (!description) return;
    const amountStr = prompt(`${t.common.total} ($):`);
    if (!amountStr) return;
    const res = await fetch(`/api/collision/claims/${claimId}/supplements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: parseFloat(amountStr) }),
    });
    if (res.ok) { toast.success(t.common.success); router.refresh(); }
    else toast.error(t.common.error);
  }

  const openClaims = claims.filter((c) => !["paid", "closed"].includes(c.status));
  const closedClaims = claims.filter((c) => ["paid", "closed"].includes(c.status));

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.collision.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500">{openClaims.length} {t.collision.openClaims} · {closedClaims.length} {t.collision.closedClaims}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowNewInsurer(true)}>
            <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">{t.collision.addInsurer}</span>
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewClaim(true)}>
            <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">{t.collision.newClaim}</span>
          </Button>
        </div>
      </div>

      {/* New insurer form */}
      {showNewInsurer && (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900">{t.collision.addInsuranceCompany}</h3>
            <button onClick={() => setShowNewInsurer(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={createInsurer} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.collision.companyName} *</label>
              <input required value={insurerForm.name}
                onChange={(e) => setInsurerForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.common.phone}</label>
              <input value={insurerForm.phone}
                onChange={(e) => setInsurerForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.common.email}</label>
              <input type="email" value={insurerForm.email}
                onChange={(e) => setInsurerForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.common.address}</label>
              <input value={insurerForm.address}
                onChange={(e) => setInsurerForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNewInsurer(false)}>{t.common.cancel}</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>{t.common.add}</Button>
            </div>
          </form>
        </div>
      )}

      {/* New claim form */}
      {showNewClaim && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900">{t.collision.newCollisionClaim}</h3>
            <button onClick={() => setShowNewClaim(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={createClaim} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.collision.claimNumber}</label>
              <input value={claimForm.claimNumber}
                onChange={(e) => setClaimForm((f) => ({ ...f, claimNumber: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.collision.insuranceCompany} *</label>
              <select required value={claimForm.insuranceCompanyId}
                onChange={(e) => setClaimForm((f) => ({ ...f, insuranceCompanyId: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">—</option>
                {insurers.map((ins: any) => <option key={ins.id} value={ins.id}>{ins.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.collision.adjusterName}</label>
              <input value={claimForm.adjusterName}
                onChange={(e) => setClaimForm((f) => ({ ...f, adjusterName: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.collision.adjusterPhone}</label>
              <input value={claimForm.adjusterPhone}
                onChange={(e) => setClaimForm((f) => ({ ...f, adjusterPhone: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.collision.coverageType}</label>
              <select value={claimForm.coverageType}
                onChange={(e) => setClaimForm((f) => ({ ...f, coverageType: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="collision">{t.collision.coverageCollision}</option>
                <option value="comprehensive">{t.collision.coverageComprehensive}</option>
                <option value="liability">{t.collision.coverageLiability}</option>
                <option value="uninsured">{t.collision.coverageUninsured}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.collision.deductible}</label>
              <input type="number" step="0.01" value={claimForm.deductible}
                onChange={(e) => setClaimForm((f) => ({ ...f, deductible: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNewClaim(false)}>{t.common.cancel}</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>{t.collision.newClaim}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Claims list */}
      <div className="space-y-3">
        {claims.map((claim) => (
          <div key={claim.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/shop/repair-orders/${claim.repairOrder.id}`} className="font-bold text-blue-600 hover:underline">
                      RO #{claim.repairOrder.roNumber}
                    </Link>
                    {claim.claimNumber && (
                      <span className="text-xs text-slate-400 font-mono">Claim: {claim.claimNumber}</span>
                    )}
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[claim.status])}>
                      {statusLabel(claim.status)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {claim.repairOrder.vehicle.year} {claim.repairOrder.vehicle.make} {claim.repairOrder.vehicle.model}
                  </p>
                  <p className="text-sm text-slate-500">
                    {claim.repairOrder.customer.firstName} {claim.repairOrder.customer.lastName}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-1">
                {claim.insuranceCompany && (
                  <p className="text-sm font-medium text-slate-700">{claim.insuranceCompany.name}</p>
                )}
                {claim.adjusterName && (
                  <p className="text-xs text-slate-400">{t.collision.adjuster}: {claim.adjusterName}</p>
                )}
                {claim.deductible > 0 && (
                  <p className="text-xs text-slate-500">{t.collision.deductible}: {formatCurrency(claim.deductible)}</p>
                )}
              </div>
            </div>

            {/* Supplements */}
            {claim.supplements.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">{t.collision.supplements}</p>
                <div className="space-y-1">
                  {claim.supplements.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{s.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(s.amount)}</span>
                        <span className={cn("px-2 py-0.5 rounded-full", SUPPLEMENT_STATUSES[s.status])}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3 flex-wrap">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => addSupplement(claim.id)}>
                <Plus className="w-3 h-3 mr-1" /> {t.collision.addSupplement}
              </Button>
              <Link href={`/shop/repair-orders/${claim.repairOrder.id}`}>
                <Button size="sm" variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" /> {t.collision.viewRO}
                </Button>
              </Link>
            </div>
          </div>
        ))}
        {claims.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
            {t.collision.noClaims}
          </div>
        )}
      </div>
    </div>
  );
}
