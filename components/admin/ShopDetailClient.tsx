"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Pause, Play, X, RefreshCw, LogIn, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function ShopDetailClient({ shop, recentROs, integrations }: {
  shop: any;
  recentROs: any[];
  integrations: any[];
}) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const subscription = shop.subscriptions[0];
  const isSuspended = shop.isSuspended;

  async function suspend() {
    if (!confirm(`Suspend ${shop.name}? They will lose access immediately.`)) return;
    setActing("suspend");
    const res = await fetch(`/api/admin/shops/${shop.id}/suspend`, { method: "POST" });
    setActing(null);
    if (res.ok) { toast.success("Shop suspended"); router.refresh(); }
    else toast.error("Failed to suspend");
  }

  async function unsuspend() {
    setActing("unsuspend");
    const res = await fetch(`/api/admin/shops/${shop.id}/unsuspend`, { method: "POST" });
    setActing(null);
    if (res.ok) { toast.success("Shop reactivated"); router.refresh(); }
    else toast.error("Failed to reactivate");
  }

  async function extendTrial() {
    const days = prompt("Extend trial by how many days?", "14");
    if (!days) return;
    setActing("extend");
    const res = await fetch(`/api/admin/shops/${shop.id}/extend-trial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: parseInt(days) }),
    });
    setActing(null);
    if (res.ok) { toast.success(`Trial extended by ${days} days`); router.refresh(); }
    else toast.error("Failed to extend trial");
  }

  async function impersonate() {
    if (!confirm(`Impersonate ${shop.name}? You'll be logged in as a shop user.`)) return;
    setActing("impersonate");
    const res = await fetch(`/api/admin/shops/${shop.id}/impersonate`, { method: "POST" });
    if (res.ok) {
      window.location.href = "/shop/dashboard";
    } else {
      setActing(null);
      toast.error("Impersonation failed");
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/shops" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to shops
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
            {isSuspended && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium border border-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Suspended
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">{shop.email} · Joined {new Date(shop.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={impersonate} disabled={!!acting}>
            <LogIn className="w-4 h-4 mr-1.5" /> Impersonate
          </Button>
          {subscription?.status === "trialing" && (
            <Button variant="outline" onClick={extendTrial} disabled={!!acting}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Extend Trial
            </Button>
          )}
          {isSuspended ? (
            <Button className="bg-green-600 hover:bg-green-700" onClick={unsuspend} disabled={!!acting}>
              <Play className="w-4 h-4 mr-1.5" /> Reactivate
            </Button>
          ) : (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={suspend} disabled={!!acting}>
              <Pause className="w-4 h-4 mr-1.5" /> Suspend
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Status" value={subscription?.status ?? "—"} />
        <Stat label="Plan" value={subscription ? "$149/mo" : "—"} />
        <Stat label="Add-ons" value={subscription?.addons?.length ?? 0} />
        <Stat label="Users" value={shop.users.length} />
        <Stat label="ROs created" value={shop._count.repairOrders} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subscription details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Subscription</h2>
          {subscription ? (
            <div className="space-y-2 text-sm">
              <Row label="Status" value={<span className="capitalize">{subscription.status}</span>} />
              <Row label="Stripe Subscription ID" value={<span className="font-mono text-xs">{subscription.stripeSubscriptionId}</span>} />
              <Row label="Current Period End" value={subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "—"} />
              {subscription.trialEndsAt && (
                <Row label="Trial Ends" value={new Date(subscription.trialEndsAt).toLocaleDateString()} />
              )}
              {subscription.addons.length > 0 && (
                <div>
                  <p className="text-slate-500 text-xs uppercase font-semibold tracking-wide mt-3 mb-1.5">Active Add-ons</p>
                  <ul className="space-y-1">
                    {subscription.addons.map((a: any) => (
                      <li key={a.id} className="text-slate-700 capitalize">• {a.addonKey.replace("_", " ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No active subscription</p>
          )}
        </div>

        {/* Location info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Locations</h2>
          {shop.locations.map((loc: any) => (
            <div key={loc.id} className="space-y-1 text-sm">
              <p className="font-medium text-slate-800">{loc.name || "Primary"}</p>
              <p className="text-slate-500">{loc.address}</p>
              <p className="text-slate-500">{loc.city}, {loc.state} {loc.zip}</p>
              <p className="text-slate-500">{loc.phone}</p>
            </div>
          ))}
          {shop.locations.length === 0 && <p className="text-sm text-slate-400">No location set</p>}
        </div>

        {/* Users */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Users ({shop.users.length})</h2>
          <div className="space-y-2 text-sm">
            {shop.users.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <div>
                  <p className="font-medium text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email} · <span className="capitalize">{u.role.replace("_", " ")}</span></p>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full",
                  u.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                )}>
                  {u.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations health */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Integrations</h2>
          {integrations.length === 0 ? (
            <p className="text-sm text-slate-400">No integrations configured</p>
          ) : (
            <div className="space-y-1.5 text-sm">
              {integrations.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between">
                  <span className="capitalize text-slate-700">{i.type.replace("_", " ")}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                    i.status === "healthy" ? "bg-green-100 text-green-700" :
                    i.status === "degraded" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-600"
                  )}>{i.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent ROs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="font-semibold text-slate-900 px-5 py-3 border-b border-slate-100">Recent Repair Orders</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">RO #</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Total</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {recentROs.map((ro) => (
              <tr key={ro.id} className="border-b border-slate-50">
                <td className="px-5 py-3 font-mono text-purple-600">#{ro.roNumber}</td>
                <td className="px-5 py-3 capitalize text-slate-600">{ro.status.replace("_", " ")}</td>
                <td className="px-5 py-3 text-right font-medium">{formatCurrency(ro.grandTotal)}</td>
                <td className="px-5 py-3 text-right text-slate-400 text-xs">
                  {new Date(ro.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {recentROs.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">No ROs yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1 capitalize">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
