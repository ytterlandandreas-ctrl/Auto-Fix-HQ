"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function LoginPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/shop/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error(t.auth.invalidCredentials);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      {/* Language switcher in corner */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 mb-2">
            <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Auto Fix HQ</h1>
          <p className="text-slate-400 text-sm sm:text-base">The shop OS built for the floor</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">{t.auth.signIn}</CardTitle>
            <CardDescription className="text-slate-400">
              {t.auth.signInToContinue}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">{t.common.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@shop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">{t.auth.password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? t.common.loading : t.auth.signIn}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">
              {t.auth.dontHaveAccount}{" "}
              <a href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                {t.onboarding.startTrial}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
