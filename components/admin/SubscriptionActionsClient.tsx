"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { RefreshCw, X, Play, ExternalLink, ArrowUpDown, Gift } from "lucide-react";
import { toast } from "sonner";
import { PLAN_DISPLAY, TIER_DISPLAY_PRICES, type PlanTier } from "@/lib/plan-access";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-red-100 text-red-600",
  canceled: "bg-slate-100 text-slate-500",
  incomplete: "bg-yellow-100 text-yellow-700",
  free: "bg-slate-100 text-slate-600",
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

const FREE_ACCESS_BADGES: Record<string, string> = {
  complimentary: "bg-pink-100 text-pink-700",
  permanent_free: "bg-slate-100 text-slate-600",
  extended_trial: "bg-cyan-100 text-cyan-700",
};

const PROCESSOR_BADGES: Record<string, { label: string; color: string }> = {
  stripe_connect: { label: "Stripe", color: "bg-violet-100 text-violet-700" },
  paypal: { label: "PayPal", color: "bg-blue-100 text-blue-700" },
  square: { label: "Square", color: "bg-emerald-100 text-emerald-700" },
};

const ADDON_PRICES: Record<string, number> = {
  quickbooks: 25, crm: 29, dvi_pro: 19, partstech: 15,
  google_reviews: 19, tech_suite: 19, collision: 39, sms_campaigns: 29,
};

function ChangePlanModal({
  subId,
  currentTier,
  shopName,
  onClose,
  onChanged,
}: {
  subId: string;
  currentTier: string;
  shopName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [tier, setTier] = useState(currentTier);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (tier === currentTier) { onClose(); return; }
    setSaving(true);
    const res = await fetch(`/api/admin/subscriptions/${subId}/change-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(`Plan changed to ${tier} for ${shopName}`);
      onChanged();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to change plan");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Change plan — {shopName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["free", "starter", "pro", "enterprise"] as const).map((t) => (
            <button key={t} onClick={() => setTier(t)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                tier === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}>
              <span className="capitalize">{t}</span>
              <span className="text-xs text-slate-400">
                {PLAN_DISPLAY[t].priceLabel}
              </span>
            </button>
          ))}
        </div>
        {tier === "free" && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            Warning: Moving to Free will cancel the Stripe subscription and immediately restrict features.
          </p>
        )}
        {tier !== currentTier && tier !== "free" && (
          <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            Stripe will generate an immediate prorated invoice for the plan change.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={save} disabled={saving}>
            {saving ? "Changing…" : "Save plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function GrantFreeModal({
  subId,
  shopName,
  onClose,
  onGranted,
}: {
  subId: string;
  shopName: string;
  onClose: () => void;
  onGranted: () => void;
}) {
  const [mode, setMode] = useState("complimentary");
  const [note, setNote] = useState("");
  const [days, setDays] = useState("30");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/subscriptions/${subId}/grant-free-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, note: note || undefined, durationDays: parseInt(days) }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(`Free access granted to ${shopName}`);
      onGranted();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to grant free access");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Grant free access — {shopName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="space-y-2">
          {[
            { val: "complimentary", label: "Complimentary (full access, no charge)", desc: "Beta partner, friend, sponsor. Gets everything." },
            { val: "extended_trial", label: "Extend trial", desc: "Keep them in trial status for N more days." },
            { val: "permanent_free", label: "Permanent free tier", desc: "Downgrade to free plan indefinitely." },
          ].map((opt) => (
            <button key={opt.val} onClick={() => setMode(opt.val)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                mode === opt.val ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:bg-slate-50"
              }`}>
              <p className={`font-medium ${mode === opt.val ? "text-purple-700" : "text-slate-800"}`}>{opt.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
        {mode === "extended_trial" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Extend by (days)</label>
            <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Internal note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Beta launch partner"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={save} disabled={saving}>
            {saving ? "Granting…" : "Grant access"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionActionsClient({ subscriptions }: { subscriptions: any[] }) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [changePlanTarget, setChangePlanTarget] = useState<{ id: string; tier: string; name: string } | null>(null);
  const [grantFreeTarget, setGrantFreeTarget] = useState<{ id: string; name: string } | null>(null);

  async function extendTrial(id: string) {
    const days = prompt("Extend trial by how many days?", "14");
    if (!days) return;
    setActing(`extend-${id}`);
    const res = await fetch(`/api/admin/subscriptions/${id}/extend-trial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: parseInt(days) }),
    });
    setActing(null);
    if (res.ok) { toast.success(`Trial extended by ${days} days`); router.refresh(); }
    else toast.error("Failed to extend trial");
  }

  async function cancelSub(id: string, shopName: string) {
    if (!confirm(`Cancel subscription for ${shopName}? This will immediately terminate their access.`)) return;
    setActing(`cancel-${id}`);
    const res = await fetch(`/api/admin/subscriptions/${id}/cancel`, { method: "POST" });
    setActing(null);
    if (res.ok) { toast.success("Subscription canceled"); router.refresh(); }
    else toast.error("Failed to cancel");
  }

  async function reactivate(id: string) {
    setActing(`reactivate-${id}`);
    const res = await fetch(`/api/admin/subscriptions/${id}/reactivate`, { method: "POST" });
    setActing(null);
    if (res.ok) { toast.success("Subscription reactivated"); router.refresh(); }
    else toast.error("Failed to reactivate");
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Shop</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Plan</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Processors</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Add-ons</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">MRR</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Trial Ends</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Started</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => {
              if (!sub.shop) return null;
              const tier = (sub.planTier as string) ?? "starter";
              const tierPrice = TIER_DISPLAY_PRICES[tier as PlanTier] ?? 149;
              const addonMRR = sub.addons.reduce((sum: number, a: any) => sum + (ADDON_PRICES[a.addonKey] ?? 0), 0);
              const mrr = (sub.status === "active" || sub.status === "complimentary") ? tierPrice + addonMRR : 0;
              const processors = (sub.shop.integrations ?? []).filter(
                (i: any) => ["stripe_connect", "paypal", "square"].includes(i.type) && i.status === "healthy"
              );
              const isActing = acting?.endsWith(sub.id);

              return (
                <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/shops/${sub.shop.id}`} className="font-medium text-purple-600 hover:underline">
                      {sub.shop.name}
                    </Link>
                    <p className="text-xs text-slate-400">{sub.shop.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_COLORS[sub.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {sub.status}
                      </span>
                      {sub.freeAccessMode && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${FREE_ACCESS_BADGES[sub.freeAccessMode] ?? "bg-slate-100 text-slate-500"}`}>
                          {sub.freeAccessMode === "complimentary" ? "Complimentary" :
                           sub.freeAccessMode === "permanent_free" ? "Perm. Free" : "Ext. Trial"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TIER_COLORS[tier] ?? "bg-slate-100 text-slate-500"}`}>
                      {tier}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {processors.length > 0 ? processors.map((p: any) => {
                        const badge = PROCESSOR_BADGES[p.type];
                        return badge ? (
                          <span key={p.type} className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        ) : null;
                      }) : <span className="text-xs text-slate-300">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {sub.addons.length > 0 ? sub.addons.map((a: any) => a.addonKey).join(", ") : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">{formatCurrency(mrr)}</td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs">
                    {sub.shop.trialEndsAt ? new Date(sub.shop.trialEndsAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Change plan */}
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                        onClick={() => setChangePlanTarget({ id: sub.id, tier, name: sub.shop.name })}
                        disabled={!!acting}>
                        <ArrowUpDown className="w-3 h-3 mr-1" /> Plan
                      </Button>
                      {/* Grant free */}
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => setGrantFreeTarget({ id: sub.id, name: sub.shop.name })}
                        disabled={!!acting}>
                        <Gift className="w-3 h-3" />
                      </Button>
                      {sub.status === "trialing" && (
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                          onClick={() => extendTrial(sub.id)} disabled={!!acting}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Extend
                        </Button>
                      )}
                      {(sub.status === "canceled" || sub.status === "past_due") && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-7 px-2"
                          onClick={() => reactivate(sub.id)} disabled={!!acting}>
                          <Play className="w-3 h-3 mr-1" /> Reactivate
                        </Button>
                      )}
                      {(sub.status === "active" || sub.status === "trialing") && (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-2"
                          onClick={() => cancelSub(sub.id, sub.shop.name)} disabled={!!acting}>
                          <X className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                      )}
                      {sub.stripeSubscriptionId && (
                        <a href={`https://dashboard.stripe.com/subscriptions/${sub.stripeSubscriptionId}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-slate-400 hover:text-slate-700 h-7 px-2">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400">No subscriptions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {changePlanTarget && (
        <ChangePlanModal
          subId={changePlanTarget.id}
          currentTier={changePlanTarget.tier}
          shopName={changePlanTarget.name}
          onClose={() => setChangePlanTarget(null)}
          onChanged={() => { setChangePlanTarget(null); router.refresh(); }}
        />
      )}

      {grantFreeTarget && (
        <GrantFreeModal
          subId={grantFreeTarget.id}
          shopName={grantFreeTarget.name}
          onClose={() => setGrantFreeTarget(null)}
          onGranted={() => { setGrantFreeTarget(null); router.refresh(); }}
        />
      )}
    </>
  );
}
