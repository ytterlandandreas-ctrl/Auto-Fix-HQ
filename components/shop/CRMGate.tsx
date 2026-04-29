"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/LocaleProvider";

export function CRMGate() {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 space-y-4 text-center">
      <div className="text-5xl">🎯</div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.crm.gateTitle}</h1>
      <p className="text-slate-500 max-w-md text-sm sm:text-base">{t.crm.gateDescription}</p>
      <Link href="/shop/settings">
        <Button className="bg-blue-600 hover:bg-blue-700">{t.crm.upgradeBtn}</Button>
      </Link>
    </div>
  );
}
