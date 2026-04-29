"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Check, ChevronRight, Building, CreditCard, Zap, Users } from "lucide-react";
import { toast } from "sonner";

const ADDONS = [
  { key: "quickbooks", label: "QuickBooks Online Sync", price: 25, description: "Sync invoices and payments to QuickBooks automatically." },
  { key: "crm", label: "Advanced CRM & Campaigns", price: 29, description: "Win-back, oil-change reminders, post-service follow-ups." },
  { key: "dvi_pro", label: "DVI Pro (video + portal)", price: 19, description: "Video inspections + branded customer portal." },
  { key: "partstech", label: "PartsTech Parts Ordering", price: 15, description: "Search and order parts without leaving the app." },
  { key: "google_reviews", label: "Google Reviews Automation", price: 19, description: "Auto-send review requests after service." },
  { key: "tech_suite", label: "Technician Efficiency Suite", price: 19, description: "Detailed efficiency reports + benchmarking." },
  { key: "collision", label: "Body/Collision Module", price: 39, description: "Insurance claims, supplements, OEM/aftermarket flags." },
  { key: "sms_campaigns", label: "SMS Marketing Campaigns", price: 29, description: "Bulk SMS marketing with segmentation." },
];

export function OnboardingWizard({ shop }: { shop: any }) {
  const { t } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);

  const STEPS = [
    { id: 1, label: t.onboarding.stepShop, icon: Building },
    { id: 2, label: t.onboarding.stepDetails, icon: Zap },
    { id: 3, label: t.onboarding.stepAddons, icon: Users },
    { id: 4, label: t.onboarding.stepPayment, icon: CreditCard },
  ];
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: shop?.name ?? "",
    address: shop?.locations?.[0]?.address ?? "",
    city: shop?.locations?.[0]?.city ?? "",
    state: shop?.locations?.[0]?.state ?? "",
    zip: shop?.locations?.[0]?.zip ?? "",
    phone: shop?.locations?.[0]?.phone ?? "",
    laborRate: "120",
    taxRate: "8.25",
    shopType: "auto_repair",
    addons: [] as string[],
  });

  const totalPrice = 149 + form.addons.reduce((sum, key) => {
    return sum + (ADDONS.find((a) => a.key === key)?.price ?? 0);
  }, 0);

  function toggleAddon(key: string) {
    setForm((f) => ({
      ...f,
      addons: f.addons.includes(key) ? f.addons.filter((a) => a !== key) : [...f.addons, key],
    }));
  }

  async function complete() {
    setSaving(true);
    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t.onboarding.welcomeMessage);
      router.push("/shop/dashboard");
    } else {
      toast.error(t.common.error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-3xl mx-auto">
        {/* Progress steps */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isComplete = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isComplete ? "bg-green-600 text-white" :
                    isActive ? "bg-blue-600 text-white" :
                    "bg-slate-200 text-slate-500"
                  )}>
                    {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={cn("text-xs font-medium mt-1.5", isActive ? "text-blue-600" : "text-slate-500")}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-2 -mt-5", step > s.id ? "bg-green-600" : "bg-slate-200")} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.onboarding.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{t.onboarding.subtitle}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">{t.auth.shopName} *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">{t.onboarding.shopType}</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {[
                      { value: "auto_repair", label: t.onboarding.autoRepair },
                      { value: "body_collision", label: t.onboarding.bodyCollision },
                      { value: "both", label: t.onboarding.both },
                    ].map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => setForm((f) => ({ ...f, shopType: opt.value }))}
                        className={cn("py-3 rounded-lg border text-sm font-medium",
                          form.shopType === opt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">{t.common.address}</label>
                  <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">{t.common.city}</label>
                  <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600">{t.common.state}</label>
                    <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                      className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">{t.common.zip}</label>
                    <input value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                      className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">{t.common.phone}</label>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.onboarding.operatingTitle}</h1>
                <p className="text-sm text-slate-500 mt-1">{t.onboarding.operatingSubtitle}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">{t.onboarding.laborRate}</label>
                  <input type="number" step="0.01" value={form.laborRate}
                    onChange={(e) => setForm((f) => ({ ...f, laborRate: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">{t.onboarding.taxRate}</label>
                  <input type="number" step="0.01" value={form.taxRate}
                    onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.onboarding.addonsTitle}</h1>
                <p className="text-sm text-slate-500 mt-1">{t.onboarding.addonsSubtitle}</p>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {ADDONS.map((addon) => {
                  const selected = form.addons.includes(addon.key);
                  return (
                    <button key={addon.key} type="button" onClick={() => toggleAddon(addon.key)}
                      className={cn("w-full text-left p-4 rounded-lg border transition-all",
                        selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                      )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{addon.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{addon.description}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-sm font-bold text-slate-700">+${addon.price}/mo</span>
                          <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center",
                            selected ? "bg-blue-600 border-blue-600" : "border-slate-300"
                          )}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="text-slate-700">{t.onboarding.basePlan}</span>
                <span className="font-bold text-blue-600 text-lg">${totalPrice}/mo</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.onboarding.paymentTitle}</h1>
                <p className="text-sm text-slate-500 mt-1">{t.onboarding.paymentSubtitle}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{t.onboarding.basePlan}</span>
                  <span className="font-medium">$149/mo</span>
                </div>
                {form.addons.map((key) => {
                  const addon = ADDONS.find((a) => a.key === key);
                  return addon ? (
                    <div key={key} className="flex justify-between text-sm text-slate-500">
                      <span>{addon.label}</span>
                      <span>+${addon.price}/mo</span>
                    </div>
                  ) : null;
                })}
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="font-semibold text-slate-900">{t.onboarding.totalAfterTrial}</span>
                  <span className="font-bold text-slate-900 text-lg">${totalPrice}/mo</span>
                </div>
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2 mt-2">
                  {t.onboarding.trialBenefit1} · {t.onboarding.trialBenefit2} · {t.onboarding.trialBenefit3}
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /> {t.onboarding.feature1}</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /> {t.onboarding.feature2}</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /> {t.onboarding.feature3}</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /> {t.onboarding.feature4}</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 sm:mt-8 pt-6 border-t border-slate-100">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>{t.common.back}</Button>
            ) : <div />}
            {step < 4 ? (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setStep((s) => s + 1)}>
                {t.common.continue} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={complete} disabled={saving}>
                {saving ? t.onboarding.settingUp : t.onboarding.startTrial}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
