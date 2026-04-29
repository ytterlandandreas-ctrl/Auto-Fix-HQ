"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { dictionaries, type Locale, type Dictionary, LOCALES } from "./dictionaries";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
  formatDate: (d: Date | string) => string;
  formatDateTime: (d: Date | string) => string;
  formatCurrency: (n: number | null | undefined) => string;
  interpolate: (template: string, vars: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "afhq-locale";
const COOKIE_KEY = "afhq-locale";

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {}
  // Detect from browser
  const browser = (navigator.language || "en").toLowerCase();
  if (browser.startsWith("es")) return "es";
  return "en";
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "en");

  // Hydrate from storage on mount
  useEffect(() => {
    const detected = detectInitialLocale();
    if (detected !== locale) setLocaleState(detected);
    document.documentElement.lang = detected;
  }, []); // eslint-disable-line

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.cookie = `${COOKIE_KEY}=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
      document.documentElement.lang = l;
    } catch {}
  }, []);

  const t = dictionaries[locale] ?? dictionaries.en;

  const formatDate = useCallback((d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString(locale === "es" ? "es-MX" : "en-US");
  }, [locale]);

  const formatDateTime = useCallback((d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleString(locale === "es" ? "es-MX" : "en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }, [locale]);

  const formatCurrency = useCallback((n: number | null | undefined) => {
    if (n == null) return locale === "es" ? "$0.00" : "$0.00";
    return new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);
  }, [locale]);

  const interpolate = useCallback((template: string, vars: Record<string, string | number>) => {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, formatDate, formatDateTime, formatCurrency, interpolate }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Fallback for components that render before provider hydrates
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: dictionaries.en,
      formatDate: (d: Date | string) => new Date(d).toLocaleDateString("en-US"),
      formatDateTime: (d: Date | string) => new Date(d).toLocaleString("en-US"),
      formatCurrency: (n: number | null | undefined) => `$${(n ?? 0).toFixed(2)}`,
      interpolate: (template: string, vars: Record<string, string | number>) =>
        template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)),
    };
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}

export { LOCALES };
