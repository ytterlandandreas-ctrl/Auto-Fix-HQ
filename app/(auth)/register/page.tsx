"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wrench, CheckCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useT } from "@/lib/i18n/LocaleProvider";

const FEATURES = [
  "14-day free trial, no credit card required",
  "Repair orders, estimates & invoicing",
  "Digital vehicle inspections with photo",
  "Two-way SMS customer communication",
  "Real-time technician board",
  "Cancel anytime — no contracts",
];

export default function RegisterPage() {
  const t = useT();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const router = useRouter();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Registration failed");
      return;
    }

    toast.success("Account created! Setting up your shop...");
    router.push("/login?registered=true");
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 space-y-8">
        <div>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Auto Fix HQ</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            The shop OS built<br />for the floor,<br />not the boardroom.
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            Everything your shop needs in one place — from estimate to payment.
          </p>
        </div>
        <ul className="space-y-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">
              {step === 1 ? t.auth.step1 : t.auth.step2}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step}/2
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <Field label={t.auth.shopName} value={form.shopName} onChange={update("shopName")} placeholder="Acme Auto Repair" required />
                  <Field label={t.auth.yourName} value={form.ownerName} onChange={update("ownerName")} placeholder="Jane Smith" required />
                  <Field label={t.common.email} type="email" value={form.email} onChange={update("email")} placeholder="jane@acmeauto.com" required />
                  <Field label={t.auth.password} type="password" value={form.password} onChange={update("password")} placeholder="••••••••" required />
                  <Field label={t.common.phone} type="tel" value={form.phone} onChange={update("phone")} placeholder="(555) 123-4567" required />
                </>
              ) : (
                <>
                  <Field label={t.common.address} value={form.address} onChange={update("address")} placeholder="123 Main St" required />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.common.city} value={form.city} onChange={update("city")} placeholder="Austin" required />
                    <Field label={t.common.state} value={form.state} onChange={update("state")} placeholder="TX" required />
                  </div>
                  <Field label={t.common.zip} value={form.zip} onChange={update("zip")} placeholder="78701" required />
                </>
              )}

              <div className="flex gap-3">
                {step === 2 && (
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 border-slate-600 text-slate-300">
                    {t.common.back}
                  </Button>
                )}
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? t.common.loading : step === 1 ? t.common.continue : t.onboarding.startTrial}
                </Button>
              </div>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">
              {t.auth.alreadyHaveAccount}{" "}
              <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium">{t.auth.signIn}</a>
            </p>
            <p className="mt-2 text-center text-xs text-slate-500">
              <a href="/pricing" className="text-slate-400 hover:text-slate-300 underline">View pricing & plans →</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-300">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={type === "password" ? 8 : undefined}
        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
      />
    </div>
  );
}
