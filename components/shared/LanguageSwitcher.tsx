"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useLocale, LOCALES } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors",
          compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
        )}
        aria-label="Change language"
      >
        <Globe className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span className="font-medium">{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg border border-slate-200 shadow-lg z-50 py-1">
          {LOCALES.map((opt) => (
            <button
              key={opt.code}
              onClick={() => { setLocale(opt.code); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{opt.flag}</span>
                <span className="text-slate-700">{opt.label}</span>
              </span>
              {locale === opt.code && <Check className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
