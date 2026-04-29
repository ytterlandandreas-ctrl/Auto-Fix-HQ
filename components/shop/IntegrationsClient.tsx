"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";

export function IntegrationsClient({ integrations, activeAddons, shopId }: {
  integrations: any[];
  activeAddons: string[];
  shopId: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [checking, setChecking] = useState<string | null>(null);

  const INTEGRATION_CATALOG = [
    { type: "quickbooks", label: "QuickBooks Online", description: "Sync invoices and payments to your accounting software.", icon: "💼", addonKey: "quickbooks", category: t.integrations.catAccounting },
    { type: "stripe_connect", label: "Stripe Payments", description: "Accept customer payments online and in-person.", icon: "💳", addonKey: null, category: t.integrations.catPayments },
    { type: "paypal", label: "PayPal", description: "Accept PayPal, Venmo, and Pay Later from customers on invoices.", icon: "🅿️", addonKey: null, category: t.integrations.catPayments },
    { type: "square", label: "Square", description: "Accept cards, contactless, and online payments via Square.", icon: "🟦", addonKey: null, category: t.integrations.catPayments },
    { type: "twilio", label: "Twilio SMS", description: "Send and receive two-way text messages with customers.", icon: "💬", addonKey: null, category: t.integrations.catComms },
    { type: "resend", label: "Email (Resend)", description: "Send transactional and marketing emails.", icon: "📧", addonKey: null, category: t.integrations.catComms },
    { type: "pusher", label: "Pusher Real-time", description: "Powers live technician board and message notifications.", icon: "⚡", addonKey: null, category: t.integrations.catInfra },
    { type: "partstech", label: "PartsTech", description: "Search and order parts without leaving Auto Fix HQ.", icon: "🔧", addonKey: "partstech", category: t.integrations.catParts },
    { type: "google_reviews", label: "Google Reviews", description: "Auto-request reviews after service, display your rating.", icon: "⭐", addonKey: "google_reviews", category: t.integrations.catMarketing },
    { type: "carfax", label: "CARFAX", description: "VIN decode and vehicle history reports on every vehicle.", icon: "🚗", addonKey: null, category: t.integrations.catVehicleData },
    { type: "motor", label: "MOTOR Labor Guide", description: "Standard labor time lookups on every repair order line.", icon: "📋", addonKey: null, category: t.integrations.catVehicleData },
    { type: "vercel_blob", label: "Vercel Blob Storage", description: "Cloud storage for DVI photos and inspection media.", icon: "📁", addonKey: null, category: t.integrations.catInfra },
  ];

  const STATUS_CONFIG = {
    healthy: { color: "text-green-600", bg: "bg-green-50 border-green-200", icon: CheckCircle, label: t.integrations.healthy },
    degraded: { color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", icon: AlertTriangle, label: t.integrations.degraded },
    down: { color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle, label: t.integrations.down },
  };

  const integrationMap = new Map(integrations.map((i) => [i.type, i]));

  async function checkHealth(type: string) {
    setChecking(type);
    const res = await fetch(`/api/integrations/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setChecking(null);
    if (res.ok) {
      toast.success(t.integrations.healthCheckComplete);
      router.refresh();
    } else {
      toast.error(t.integrations.healthCheckFailed);
    }
  }

  async function connectStripe() {
    const res = await fetch("/api/integrations/stripe-connect", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      toast.error(t.common.error);
    }
  }

  async function connectQuickBooks() {
    const res = await fetch("/api/integrations/quickbooks/auth", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      toast.error(t.common.error);
    }
  }

  async function connectPayPal() {
    const res = await fetch("/api/integrations/paypal", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      toast.error(t.common.error);
    }
  }

  async function connectSquare() {
    const res = await fetch("/api/integrations/square", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      toast.error(t.common.error);
    }
  }

  const categories = [...new Set(INTEGRATION_CATALOG.map((i) => i.category))];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.integrations.title}</h1>
        <p className="text-xs sm:text-sm text-slate-500">{t.integrations.subtitle}</p>
      </div>

      {/* Health summary bar */}
      {integrations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">{t.integrations.systemHealth}</h2>
          <div className="flex gap-4 sm:gap-6 flex-wrap">
            {["healthy", "degraded", "down"].map((status) => {
              const count = integrations.filter((i) => i.status === status).length;
              const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
              const Icon = cfg.icon;
              return (
                <div key={status} className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", cfg.color)} />
                  <span className="text-sm text-slate-700"><span className="font-bold">{count}</span> {cfg.label}</span>
                </div>
              );
            })}
            <div className="ml-auto text-xs text-slate-400">
              {integrations[0]?.lastCheckedAt
                ? t.integrations.lastChecked.replace("{time}", new Date(integrations[0].lastCheckedAt).toLocaleTimeString())
                : t.integrations.notChecked}
            </div>
          </div>
        </div>
      )}

      {/* Integration cards by category */}
      {categories.map((category) => {
        const catIntegrations = INTEGRATION_CATALOG.filter((i) => i.category === category);
        return (
          <div key={category}>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {catIntegrations.map((catalog) => {
                const live = integrationMap.get(catalog.type);
                const isLocked = catalog.addonKey && !activeAddons.includes(catalog.addonKey);
                const status = live?.status as keyof typeof STATUS_CONFIG | undefined;
                const cfg = status ? STATUS_CONFIG[status] : null;
                const Icon = cfg?.icon;

                return (
                  <div key={catalog.type} className={cn(
                    "bg-white rounded-xl border p-4 transition-all",
                    live ? (cfg?.bg ?? "border-slate-200") : "border-slate-200",
                    isLocked && "opacity-60"
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{catalog.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 text-sm">{catalog.label}</p>
                            {isLocked && (
                              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Lock className="w-3 h-3" /> {t.integrations.addonRequired}
                              </span>
                            )}
                            {live && cfg && Icon && (
                              <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", cfg.bg, cfg.color)}>
                                <Icon className="w-3 h-3" /> {cfg.label}
                              </span>
                            )}
                            {!live && !isLocked && (
                              <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">{t.integrations.notConnected}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{catalog.description}</p>
                        </div>
                      </div>
                    </div>

                    {!isLocked && (
                      <div className="flex gap-2 mt-3">
                        {live ? (
                          <>
                            <Button size="sm" variant="outline" className="text-xs"
                              onClick={() => checkHealth(catalog.type)}
                              disabled={checking === catalog.type}>
                              <RefreshCw className={cn("w-3 h-3 mr-1", checking === catalog.type && "animate-spin")} />
                              {t.integrations.checkHealth}
                            </Button>
                            {live.dashboardUrl && (
                              <Button size="sm" variant="outline" className="text-xs" asChild>
                                <a href={live.dashboardUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3 mr-1" /> {t.integrations.dashboard}
                                </a>
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            {catalog.type === "stripe_connect" && (
                              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-xs" onClick={connectStripe}>
                                {t.integrations.connectStripe}
                              </Button>
                            )}
                            {catalog.type === "quickbooks" && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" onClick={connectQuickBooks}>
                                {t.integrations.connectQuickBooks}
                              </Button>
                            )}
                            {catalog.type === "paypal" && (
                              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-xs" onClick={connectPayPal}>
                                Connect PayPal
                              </Button>
                            )}
                            {catalog.type === "square" && (
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={connectSquare}>
                                Connect Square
                              </Button>
                            )}
                            {!["stripe_connect", "quickbooks", "paypal", "square"].includes(catalog.type) && (
                              <p className="text-xs text-slate-400 italic">{t.integrations.configuredViaEnv}</p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {live?.errorMessage && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {live.errorMessage}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
