import Link from "next/link";
import { Check, X, Wrench, Zap } from "lucide-react";
import { PLAN_DISPLAY, PRICING_FEATURES, type PlanTier } from "@/lib/plan-access";
import { ADDON_LABELS, ADDON_PRICES_DISPLAY } from "@/lib/stripe";

export const metadata = {
  title: "Pricing — Auto Fix HQ",
  description: "Simple, transparent pricing for automotive repair shops. Start your 14-day free trial.",
};

const TIERS: PlanTier[] = ["free", "starter", "pro", "enterprise"];

const TIER_BORDER: Record<PlanTier, string> = {
  free: "border-slate-200",
  starter: "border-blue-500 ring-2 ring-blue-500",
  pro: "border-purple-300",
  enterprise: "border-amber-300",
};

const TIER_HEADER: Record<PlanTier, string> = {
  free: "bg-slate-50",
  starter: "bg-blue-600 text-white",
  pro: "bg-purple-600 text-white",
  enterprise: "bg-amber-500 text-white",
};

const TIER_BTN: Record<PlanTier, string> = {
  free: "bg-slate-800 hover:bg-slate-700 text-white",
  starter: "bg-blue-600 hover:bg-blue-700 text-white",
  pro: "bg-purple-600 hover:bg-purple-700 text-white",
  enterprise: "bg-amber-500 hover:bg-amber-600 text-white",
};

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-slate-300 mx-auto" />;
  return <span className="text-sm text-slate-700 text-center block">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Auto Fix HQ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign in</Link>
            <Link href="/register" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> 14-day free trial on all paid plans
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            No contracts. No hidden fees. Cancel anytime. Start your free trial and see why shops love Auto Fix HQ.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {TIERS.map((tier) => {
            const plan = PLAN_DISPLAY[tier];
            return (
              <div key={tier} className={`relative rounded-2xl border-2 ${TIER_BORDER[tier]} bg-white overflow-hidden flex flex-col`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 text-center text-xs font-bold py-1 bg-blue-600 text-white tracking-wide uppercase">
                    Most popular
                  </div>
                )}
                <div className={`px-6 py-6 ${TIER_HEADER[tier]} ${plan.popular ? "pt-8" : ""}`}>
                  <h2 className={`text-xl font-bold mb-1 ${tier === "free" ? "text-slate-900" : "text-white"}`}>
                    {plan.name}
                  </h2>
                  <div className={`text-3xl font-bold mb-2 ${tier === "free" ? "text-slate-900" : "text-white"}`}>
                    {plan.priceLabel}
                  </div>
                  <p className={`text-sm ${tier === "free" ? "text-slate-500" : "text-white/80"}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="px-6 py-6 flex-1 space-y-3">
                  {/* Key limits */}
                  <ul className="space-y-2.5 text-sm text-slate-700">
                    {tier === "free" && <>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> 25 repair orders/month</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> 2 team members</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> 1 location</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Customer payments via Stripe</li>
                      <li className="flex gap-2"><X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /><span className="text-slate-400">Estimates & appointments</span></li>
                      <li className="flex gap-2"><X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /><span className="text-slate-400">Inspections & add-ons</span></li>
                    </>}
                    {tier === "starter" && <>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Unlimited repair orders</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">5 team members</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">1 location</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Estimates & appointments</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Basic digital inspections</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Add-on modules available</span></li>
                    </>}
                    {tier === "pro" && <>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Everything in Starter</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">15 team members</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Up to 3 locations</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Inventory management</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Full DVI (video + photos)</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Full analytics</span></li>
                    </>}
                    {tier === "enterprise" && <>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Everything in Pro</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Unlimited users</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Unlimited locations</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">API access</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Priority support</span></li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-white/80 shrink-0 mt-0.5" /><span className="text-white/90">Dedicated onboarding</span></li>
                    </>}
                  </ul>
                </div>

                <div className="px-6 pb-6">
                  <Link
                    href={tier === "free" ? "/register" : "/register"}
                    className={`block w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors ${TIER_BTN[tier]}`}
                  >
                    {tier === "free" ? "Get started free" : tier === "enterprise" ? "Contact sales" : "Start 14-day trial"}
                  </Link>
                  {tier !== "free" && (
                    <p className="text-xs text-slate-400 text-center mt-2">No credit card required during trial</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full comparison table */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Full feature comparison</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 font-semibold text-slate-700 w-64">Feature</th>
                  {TIERS.map((tier) => (
                    <th key={tier} className="px-4 py-4 font-semibold text-slate-700 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${PLAN_DISPLAY[tier].color}`}>
                        {PLAN_DISPLAY[tier].name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRICING_FEATURES.map((row, i) => (
                  <tr key={i} className={`border-b border-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                    <td className="px-6 py-3.5 font-medium text-slate-700">{row.label}</td>
                    <td className="px-4 py-3.5 text-center"><FeatureCell value={row.free} /></td>
                    <td className="px-4 py-3.5 text-center"><FeatureCell value={row.starter} /></td>
                    <td className="px-4 py-3.5 text-center"><FeatureCell value={row.pro} /></td>
                    <td className="px-4 py-3.5 text-center"><FeatureCell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add-ons section */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">Power-up with add-ons</h2>
          <p className="text-slate-500 text-center mb-8">Available on Starter, Pro & Enterprise plans. Add only what you need.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ADDON_LABELS).map(([key, label]) => (
              <div key={key} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{label}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-slate-900">${ADDON_PRICES_DISPLAY[key]}<span className="font-normal text-slate-400 text-sm">/mo</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Common questions</h2>
          <div className="space-y-5">
            {[
              {
                q: "Do I need a credit card to start?",
                a: "No. The 14-day trial on paid plans requires no credit card. You only enter payment info when you're ready to continue after the trial.",
              },
              {
                q: "How do I accept payments from my customers?",
                a: "Connect your free Stripe account inside Auto Fix HQ. You can then send customers a payment link directly from any invoice. A small 1.5% platform fee applies on customer payments.",
              },
              {
                q: "Can I change plans later?",
                a: "Yes — upgrade or downgrade anytime from your settings. Upgrades take effect immediately with a prorated charge. Downgrades take effect at the next billing cycle.",
              },
              {
                q: "What happens when my trial ends?",
                a: "You'll receive an email reminder before the trial ends. Add a payment method in your billing settings and your subscription continues uninterrupted. If you don't, the shop switches to the free plan.",
              },
              {
                q: "Do you offer discounts for multi-location shops?",
                a: "Yes — reach out to us and we'll work out a deal. Enterprise plans include unlimited locations at one flat rate.",
              },
            ].map((item) => (
              <details key={item.q} className="bg-white border border-slate-200 rounded-xl px-6 py-4 group">
                <summary className="font-medium text-slate-900 cursor-pointer flex items-center justify-between gap-2">
                  {item.q}
                  <span className="text-slate-400 group-open:rotate-180 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-3">Ready to upgrade your shop?</h2>
          <p className="text-white/80 mb-8 text-lg">Join hundreds of shops running smarter on Auto Fix HQ.</p>
          <Link href="/register" className="inline-block bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-lg">
            Start your free trial →
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-16 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Auto Fix HQ · <Link href="/login" className="hover:underline">Sign in</Link>
      </footer>
    </div>
  );
}
