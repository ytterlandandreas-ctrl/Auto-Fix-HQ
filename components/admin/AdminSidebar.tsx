"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LocaleProvider";
import { LayoutDashboard, Building2, CreditCard, BarChart3, LogOut, Wrench, X, Layers, Tag } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();

  const NAV = [
    { href: "/admin/dashboard", label: t.nav.adminDashboard, icon: LayoutDashboard },
    { href: "/admin/shops", label: t.nav.shops, icon: Building2 },
    { href: "/admin/subscriptions", label: t.nav.subscriptions, icon: CreditCard },
    { href: "/admin/plans", label: "Plans & Pricing", icon: Layers },
    { href: "/admin/discounts", label: "Discounts & Promos", icon: Tag },
    { href: "/admin/billing", label: t.nav.billing, icon: CreditCard },
    { href: "/admin/analytics", label: t.nav.platformAnalytics, icon: BarChart3 },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} aria-hidden="true" />
      )}
      <aside
        className={cn(
          "bg-slate-900 text-white flex flex-col z-50",
          "lg:relative lg:flex-shrink-0 lg:w-56",
          "fixed top-0 left-0 h-full w-64 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Auto Fix HQ</p>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
          <button onClick={onMobileClose} className="lg:hidden text-slate-400 hover:text-white" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(href) ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" /> {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-6 py-4 text-slate-400 hover:text-white text-sm border-t border-slate-700 transition-colors"
        >
          <LogOut className="w-4 h-4" /> {t.nav.signOut}
        </button>
      </aside>
    </>
  );
}
