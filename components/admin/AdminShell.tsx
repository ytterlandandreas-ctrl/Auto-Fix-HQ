"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Menu } from "lucide-react";

export function AdminShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-slate-900">Auto Fix HQ Admin</span>
          <LanguageSwitcher compact />
        </header>
        {/* Desktop top bar with language switcher */}
        <header className="hidden lg:flex items-center justify-end px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <LanguageSwitcher compact />
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
