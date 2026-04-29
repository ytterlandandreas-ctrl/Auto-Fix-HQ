"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Building, Users, CreditCard, Bell, Plus, Trash2, Shield, Check, ExternalLink, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { PLAN_DISPLAY, TIER_DISPLAY_PRICES, type PlanTier } from "@/lib/plan-access";

const ADDON_LABELS: Record<string, { label: string; price: string }> = {
  quickbooks: { label: "QuickBooks Online Sync", price: "$25/mo" },
  crm: { label: "Advanced CRM & Campaigns", price: "$29/mo" },
  dvi_pro: { label: "DVI Pro (video + portal)", price: "$19/mo" },
  partstech: { label: "PartsTech Parts Ordering", price: "$15/mo" },
  google_reviews: { label: "Google Reviews Automation", price: "$19/mo" },
  tech_suite: { label: "Technician Efficiency Suite", price: "$19/mo" },
  collision: { label: "Body/Collision Insurance Module", price: "$39/mo" },
  sms_campaigns: { label: "SMS Marketing Campaigns", price: "$29/mo" },
};

function SetupStripeConnectButton() {
  const [loading, setLoading] = useState(false);

  async function setup() {
    setLoading(true);
    const res = await fetch("/api/integrations/stripe-connect", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("Could not start Stripe setup");
    } else {
      toast.error("Failed to connect Stripe");
    }
    setLoading(false);
  }

  return (
    <Button onClick={setup} disabled={loading} className="bg-violet-600 hover:bg-violet-700">
      <Zap className="w-4 h-4 mr-2" />
      {loading ? "Redirecting to Stripe…" : "Connect Stripe to accept payments"}
    </Button>
  );
}

export function SettingsClient({ shop, users, subscription, currentUserId, currentUserRole, activeDiscounts, stripeConnect }: {
  shop: any;
  users: any[];
  subscription: any;
  currentUserId: string;
  currentUserRole: string;
  activeDiscounts?: any[];
  stripeConnect?: { status: string; connectedAt?: string } | null;
}) {
  const { t, formatCurrency, formatDate } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("shop");

  const TABS = [
    { id: "shop", label: t.settings.tabShop, icon: Building },
    { id: "users", label: t.settings.tabUsers, icon: Users },
    { id: "billing", label: t.settings.tabBilling, icon: CreditCard },
    { id: "notifications", label: t.settings.tabNotifications, icon: Bell },
  ];
  const [shopForm, setShopForm] = useState({
    name: shop?.name ?? "",
    phone: shop?.locations?.[0]?.phone ?? "",
    address: shop?.locations?.[0]?.address ?? "",
    city: shop?.locations?.[0]?.city ?? "",
    state: shop?.locations?.[0]?.state ?? "",
    zip: shop?.locations?.[0]?.zip ?? "",
    taxRate: String(shop?.taxRate ?? "0"),
    laborRate: String(shop?.laborRate ?? "0"),
  });
  const [savingShop, setSavingShop] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", role: "service_writer", password: "" });
  const [savingUser, setSavingUser] = useState(false);

  const canManageUsers = ["shop_owner", "shop_manager"].includes(currentUserRole);

  async function saveShop(e: React.FormEvent) {
    e.preventDefault();
    setSavingShop(true);
    const res = await fetch("/api/shop/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...shopForm, taxRate: parseFloat(shopForm.taxRate), laborRate: parseFloat(shopForm.laborRate) }),
    });
    setSavingShop(false);
    if (res.ok) toast.success(t.settings.saved);
    else toast.error(t.settings.saveFailed);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSavingUser(true);
    const res = await fetch("/api/shop/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUserForm),
    });
    setSavingUser(false);
    if (res.ok) {
      toast.success(t.settings.userCreated);
      setShowNewUser(false);
      setNewUserForm({ name: "", email: "", role: "service_writer", password: "" });
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || t.settings.userCreateFailed);
    }
  }

  async function deactivateUser(id: string) {
    if (!confirm(t.settings.confirmDeactivate)) return;
    const res = await fetch(`/api/shop/users/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success(t.settings.userDeactivated); router.refresh(); }
    else toast.error(t.common.error);
  }

  async function manageSubscription() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else toast.error(t.common.error);
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.settings.title}</h1>
        <p className="text-xs sm:text-sm text-slate-500">{t.settings.subtitle}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-6">
        {/* Sidebar nav */}
        <div className="md:w-44 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn("flex items-center gap-2 md:gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 md:w-full",
                  activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                )}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-4">
          {/* Shop Info */}
          {activeTab === "shop" && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
              <h2 className="font-semibold text-slate-900 mb-4">{t.settings.shopInfo}</h2>
              <form onSubmit={saveShop} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-600">{t.auth.shopName}</label>
                  <input value={shopForm.name} onChange={(e) => setShopForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{t.common.phone}</label>
                  <input value={shopForm.phone} onChange={(e) => setShopForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{t.common.address}</label>
                  <input value={shopForm.address} onChange={(e) => setShopForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{t.common.city}</label>
                  <input value={shopForm.city} onChange={(e) => setShopForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">{t.common.state}</label>
                    <input value={shopForm.state} onChange={(e) => setShopForm((f) => ({ ...f, state: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">{t.common.zip}</label>
                    <input value={shopForm.zip} onChange={(e) => setShopForm((f) => ({ ...f, zip: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{t.onboarding.laborRate}</label>
                  <input type="number" step="0.01" value={shopForm.laborRate}
                    onChange={(e) => setShopForm((f) => ({ ...f, laborRate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{t.onboarding.taxRate}</label>
                  <input type="number" step="0.01" value={shopForm.taxRate}
                    onChange={(e) => setShopForm((f) => ({ ...f, taxRate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={savingShop}>
                    {savingShop ? t.common.saving : t.settings.saveChanges}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">{t.settings.teamMembers}</h2>
                {canManageUsers && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewUser(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> {t.settings.addUser}
                  </Button>
                )}
              </div>

              {showNewUser && (
                <div className="px-5 py-4 border-b border-slate-100 bg-blue-50/50">
                  <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">{t.common.name} *</label>
                      <input required value={newUserForm.name}
                        onChange={(e) => setNewUserForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">{t.common.email} *</label>
                      <input type="email" required value={newUserForm.email}
                        onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">{t.settings.role}</label>
                      <select value={newUserForm.role}
                        onChange={(e) => setNewUserForm((f) => ({ ...f, role: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                        <option value="service_writer">{t.settings.roleServiceWriter}</option>
                        <option value="technician">{t.settings.roleTechnician}</option>
                        <option value="shop_manager">{t.settings.roleShopManager}</option>
                        <option value="shop_owner">{t.settings.roleShopOwner}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">{t.settings.tempPassword} *</label>
                      <input type="password" required value={newUserForm.password}
                        onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
                    </div>
                    <div className="sm:col-span-2 flex gap-2 justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowNewUser(false)}>{t.common.cancel}</Button>
                      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={savingUser}>
                        {savingUser ? t.common.saving : t.settings.addUser}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">{t.common.name}</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">{t.common.email}</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">{t.settings.role}</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">{t.common.status}</th>
                    {canManageUsers && <th className="text-right px-5 py-3 font-medium text-slate-500">{t.common.actions}</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const roleLabel = ({
                      service_writer: t.settings.roleServiceWriter,
                      technician: t.settings.roleTechnician,
                      shop_manager: t.settings.roleShopManager,
                      shop_owner: t.settings.roleShopOwner,
                      platform_owner: "Platform Owner",
                    } as Record<string, string>)[u.role] ?? u.role;
                    return (
                    <tr key={u.id} className="border-b border-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {u.name}
                        {u.id === currentUserId && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{t.settings.you}</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{u.email}</td>
                      <td className="px-5 py-3 text-slate-600">{roleLabel}</td>
                      <td className="px-5 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                          u.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {u.isActive ? t.common.active : t.common.inactive}
                        </span>
                      </td>
                      {canManageUsers && (
                        <td className="px-5 py-3 text-right">
                          {u.id !== currentUserId && u.isActive && (
                            <button onClick={() => deactivateUser(u.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );})}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Billing */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              {/* Subscription plan card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                <h2 className="font-semibold text-slate-900 mb-4">{t.settings.subscription}</h2>
                {subscription ? (() => {
                  const tier = (subscription.planTier as PlanTier) ?? "starter";
                  const planInfo = PLAN_DISPLAY[tier];
                  const basePrice = TIER_DISPLAY_PRICES[tier] ?? 0;
                  const activeDiscount = activeDiscounts?.[0];
                  let discountedPrice = basePrice;
                  if (activeDiscount?.discountCode) {
                    const dc = activeDiscount.discountCode;
                    if (dc.discountType === "percent") {
                      discountedPrice = basePrice * (1 - dc.discountValue / 100);
                    } else {
                      discountedPrice = Math.max(0, basePrice - dc.discountValue);
                    }
                  }

                  const trialEnd = shop?.trialEndsAt ? new Date(shop.trialEndsAt) : null;
                  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

                  return (
                    <div className="space-y-4">
                      {/* Plan header */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", planInfo.color)}>
                              {planInfo.name} Plan
                            </span>
                            <span className={cn("text-sm font-medium px-3 py-0.5 rounded-full text-xs",
                              subscription.status === "active" ? "bg-green-100 text-green-700" :
                              subscription.status === "trialing" ? "bg-blue-100 text-blue-700" :
                              subscription.status === "free" ? "bg-slate-100 text-slate-600" :
                              "bg-red-100 text-red-600"
                            )}>
                              {subscription.status === "trialing" ? t.settings.freeTrial : subscription.status}
                            </span>
                            {subscription.freeAccessMode === "complimentary" && (
                              <span className="text-xs font-medium bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full">
                                Complimentary
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2">
                            {activeDiscount ? (
                              <>
                                <span className="text-2xl font-bold text-slate-900">${discountedPrice.toFixed(0)}/mo</span>
                                <span className="text-sm text-slate-400 line-through">${basePrice}/mo</span>
                                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                                  {activeDiscount.discountCode.discountType === "percent"
                                    ? `${activeDiscount.discountCode.discountValue}% off`
                                    : `$${activeDiscount.discountCode.discountValue} off`}
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl font-bold text-slate-900">
                                {basePrice === 0 ? "Free" : `$${basePrice}/mo`}
                              </span>
                            )}
                          </div>
                          {activeDiscount && (
                            <p className="text-xs text-green-700 mt-0.5">
                              {activeDiscount.discountCode.label}
                              {activeDiscount.discountCode.durationMonths
                                ? ` · ${activeDiscount.discountCode.durationMonths} months`
                                : " · forever"}
                              {activeDiscount.expiresAt
                                ? ` · expires ${formatDate(activeDiscount.expiresAt)}`
                                : ""}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" onClick={manageSubscription} size="sm" className="shrink-0">
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" /> {t.settings.manageBilling}
                        </Button>
                      </div>

                      {/* Trial banner */}
                      {subscription.status === "trialing" && trialDaysLeft > 0 && (
                        <div className={cn("rounded-lg px-3 py-2.5 text-sm",
                          trialDaysLeft <= 3 ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                        )}>
                          <div className="flex items-center gap-2">
                            {trialDaysLeft <= 3 && <AlertCircle className="w-4 h-4 shrink-0" />}
                            <span>
                              {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining in your free trial.{" "}
                              {trialDaysLeft <= 7 && (
                                <button onClick={manageSubscription} className="underline font-medium">
                                  Add a payment method
                                </button>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Past due warning */}
                      {subscription.status === "past_due" && (
                        <div className="bg-red-50 text-red-700 rounded-lg px-3 py-2.5 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Payment failed. Please{" "}
                            <button onClick={manageSubscription} className="underline font-medium">update your payment method</button>
                            {" "}to restore full access.
                          </span>
                        </div>
                      )}

                      {/* Active add-ons */}
                      {subscription.addons.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">{t.settings.activeAddons}</p>
                          <div className="space-y-1">
                            {subscription.addons.map((a: any) => (
                              <div key={a.id} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                  <Check className="w-3.5 h-3.5 text-green-600" />
                                  {ADDON_LABELS[a.addonKey]?.label ?? a.addonKey}
                                </span>
                                <span className="text-slate-500">{ADDON_LABELS[a.addonKey]?.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* See all plans link */}
                      <div className="pt-1">
                        <Link href="/pricing" target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <ExternalLink className="w-3 h-3" /> View all plans & pricing
                        </Link>
                      </div>
                    </div>
                  );
                })() : (
                  <p className="text-slate-400 text-sm">{t.settings.noSubscription}</p>
                )}
              </div>

              {/* Customer payment processing (Stripe Connect) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">Customer Payment Processing</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Accept credit cards from your customers directly on invoices. Powered by Stripe.
                    </p>
                  </div>
                  {stripeConnect?.status === "healthy" && (
                    <span className="shrink-0 text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Connected
                    </span>
                  )}
                </div>

                {stripeConnect?.status === "healthy" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">
                      Your Stripe account is connected. Customers can pay invoices by credit card.
                      A <strong>1.5% platform fee</strong> applies on all customer payments.
                    </p>
                    {stripeConnect.connectedAt && (
                      <p className="text-xs text-slate-400">
                        Connected {formatDate(stripeConnect.connectedAt)}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <a
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Stripe Dashboard
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Payment processing not set up</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Connect a Stripe account to start accepting credit card payments from your customers.
                          </p>
                        </div>
                      </div>
                    </div>
                    <SetupStripeConnectButton />
                  </div>
                )}
              </div>

              {/* Available add-ons */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-900">{t.settings.availableAddons}</h2>
                  <Link href="/pricing" target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> See full pricing
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(ADDON_LABELS).map(([key, info]) => {
                    const isActive = subscription?.addons?.some((a: any) => a.addonKey === key);
                    return (
                      <div key={key} className={cn("flex items-center justify-between p-3 rounded-lg border",
                        isActive ? "bg-green-50 border-green-200" : "border-slate-100"
                      )}>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{info.label}</p>
                          <p className="text-xs text-slate-500">{info.price} {t.settings.additional}</p>
                        </div>
                        {isActive ? (
                          <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                            <Check className="w-3.5 h-3.5" /> {t.common.active}
                          </span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={manageSubscription} className="text-xs">
                            {t.common.add}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
              <h2 className="font-semibold text-slate-900 mb-4">{t.settings.notifications}</h2>
              <div className="space-y-4">
                {[
                  { label: t.settings.notifApptReminder, description: t.settings.notifApptReminderDesc },
                  { label: t.settings.notifFollowUp, description: t.settings.notifFollowUpDesc },
                  { label: t.settings.notifLowStock, description: t.settings.notifLowStockDesc },
                  { label: t.settings.notifOverdue, description: t.settings.notifOverdueDesc },
                  { label: t.settings.notifReview, description: t.settings.notifReviewDesc },
                  { label: t.settings.notifInbound, description: t.settings.notifInboundDesc },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{pref.label}</p>
                      <p className="text-xs text-slate-400">{pref.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
