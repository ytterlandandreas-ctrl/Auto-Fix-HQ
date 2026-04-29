import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_DISPLAY, PLAN_FEATURES, PLAN_LIMITS, PRICING_FEATURES, type PlanTier } from "@/lib/plan-access";
import { TIER_DISPLAY_PRICES } from "@/lib/stripe";
import { formatCurrency } from "@/lib/utils";
import { Check, X, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";

const TIERS: PlanTier[] = ["free", "starter", "pro", "enterprise"];

const TIER_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-700 border-slate-200",
  starter: "bg-blue-50 text-blue-700 border-blue-200",
  pro: "bg-purple-50 text-purple-700 border-purple-200",
  enterprise: "bg-amber-50 text-amber-700 border-amber-200",
};

export default async function AdminPlansPage() {
  const session = await auth();
  if ((session!.user as any).role !== "platform_owner") return null;

  // Count shops per tier
  const tierCounts = await db.shopSubscription.groupBy({
    by: ["planTier"],
    _count: { planTier: true },
  });

  const countByTier: Record<string, number> = {};
  for (const row of tierCounts) {
    countByTier[row.planTier] = row._count.planTier;
  }

  // Total MRR from tiers
  const activeSubs = await db.shopSubscription.findMany({
    where: { status: { in: ["active", "trialing"] } },
    select: { planTier: true },
  });
  const totalMRR = activeSubs.reduce((sum, s) => sum + (TIER_DISPLAY_PRICES[s.planTier] ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plan Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            View tier configuration and shop distribution. Edit feature limits in{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">lib/plan-access.ts</code>
          </p>
        </div>
        <a
          href="/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" /> Public Pricing Page
        </a>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total MRR</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalMRR)}</p>
        </div>
        {TIERS.map((tier) => {
          const count = countByTier[tier] ?? 0;
          const mrrContribution = count * (TIER_DISPLAY_PRICES[tier] ?? 0);
          return (
            <div key={tier} className={`bg-white border rounded-xl p-5 ${TIER_COLORS[tier]}`}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1 opacity-70">
                {PLAN_DISPLAY[tier].name}
              </p>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs opacity-60 mt-1">
                {mrrContribution > 0 ? `${formatCurrency(mrrContribution)}/mo` : "No revenue"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {TIERS.map((tier) => {
          const plan = PLAN_DISPLAY[tier];
          const limits = PLAN_LIMITS[tier];
          const features = PLAN_FEATURES[tier];
          const count = countByTier[tier] ?? 0;

          return (
            <div key={tier} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className={`px-5 py-4 border-b border-slate-100`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${plan.color}`}>
                    {plan.name}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{plan.priceLabel}</span>
                </div>
                <p className="text-xs text-slate-500">{plan.description}</p>
              </div>

              {/* Stats */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Active shops</span>
                  <span className="font-bold text-slate-900">{count}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-slate-600">MRR from tier</span>
                  <span className="font-bold text-green-600">
                    {count > 0 ? formatCurrency(count * (TIER_DISPLAY_PRICES[tier] ?? 0)) : "—"}
                  </span>
                </div>
              </div>

              {/* Limits */}
              <div className="px-5 py-4 border-b border-slate-100 space-y-1.5 text-xs">
                <p className="font-semibold text-slate-600 uppercase tracking-wide text-[10px] mb-2">Limits</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Team members</span>
                  <span className="font-medium text-slate-800">{limits.maxUsers ?? "Unlimited"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Locations</span>
                  <span className="font-medium text-slate-800">{limits.maxLocations ?? "Unlimited"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ROs / month</span>
                  <span className="font-medium text-slate-800">{limits.maxROsPerMonth ?? "Unlimited"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customers</span>
                  <span className="font-medium text-slate-800">{limits.maxCustomers ?? "Unlimited"}</span>
                </div>
              </div>

              {/* Feature access */}
              <div className="px-5 py-4 flex-1 space-y-1.5 text-xs">
                <p className="font-semibold text-slate-600 uppercase tracking-wide text-[10px] mb-2">Features</p>
                {[
                  { label: "Estimates", key: "estimates" },
                  { label: "Appointments", key: "appointments" },
                  { label: "Inventory", key: "inventory" },
                  { label: "Digital Inspections", key: "inspections" },
                  { label: "Analytics", key: "analytics" },
                  { label: "Add-on modules", key: "addonsAvailable" },
                  { label: "API access", key: "apiAccess" },
                  { label: "Priority support", key: "prioritySupport" },
                ].map(({ label, key }) => {
                  const val = (features as any)[key];
                  return (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">{label}</span>
                      {val === false ? (
                        <X className="w-3.5 h-3.5 text-slate-300" />
                      ) : val === true ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <span className="text-purple-600 font-medium">{val}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex gap-2">
                <Link
                  href={`/admin/subscriptions?tier=${tier}`}
                  className="flex-1 text-center text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg transition-colors"
                >
                  View shops
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full feature comparison table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Full Feature Matrix</h2>
          <span className="text-xs text-slate-400">Matches the public /pricing page</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 font-medium text-slate-500 w-56">Feature</th>
                {TIERS.map((tier) => (
                  <th key={tier} className="text-center px-4 py-3 font-medium text-slate-500">
                    {PLAN_DISPLAY[tier].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICING_FEATURES.map((row, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="px-6 py-3 text-slate-700">{row.label}</td>
                  {(["free", "starter", "pro", "enterprise"] as const).map((tier) => (
                    <td key={tier} className="text-center px-4 py-3">
                      {row[tier] === true ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : row[tier] === false ? (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-xs text-slate-600">{row[tier]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stripe env var reference */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 mb-2">Required .env variables for billing</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono text-amber-700">
              <span>STRIPE_PRICE_BASE=price_xxx <span className="font-sans text-amber-500">(legacy Starter)</span></span>
              <span>STRIPE_PRICE_STARTER=price_xxx</span>
              <span>STRIPE_PRICE_PRO=price_xxx</span>
              <span>STRIPE_PRICE_ENTERPRISE=price_xxx</span>
              <span>STRIPE_PRICE_QUICKBOOKS=price_xxx</span>
              <span>STRIPE_PRICE_CRM=price_xxx</span>
              <span>STRIPE_PRICE_DVI_PRO=price_xxx</span>
              <span>STRIPE_PRICE_PARTSTECH=price_xxx</span>
              <span>STRIPE_PRICE_GOOGLE_REVIEWS=price_xxx</span>
              <span>STRIPE_PRICE_TECH_SUITE=price_xxx</span>
              <span>STRIPE_PRICE_COLLISION=price_xxx</span>
              <span>STRIPE_PRICE_SMS_CAMPAIGNS=price_xxx</span>
              <span>STRIPE_PRICE_EXTRA_LOCATION=price_xxx</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
