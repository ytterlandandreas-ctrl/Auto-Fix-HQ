"use client";

import { useState } from "react";
import ShopSidebar from "@/components/shop/ShopSidebar";
import ShopHeader from "@/components/shop/ShopHeader";

export function ShopShell({
  shop,
  user,
  activeAddons,
  userRole,
  children,
}: {
  shop: { name: string; logoUrl?: string | null };
  user: { name?: string | null; email?: string | null };
  activeAddons: string[];
  userRole: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <ShopSidebar
        shop={shop}
        activeAddons={activeAddons}
        userRole={userRole}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <ShopHeader
          shop={shop}
          user={user}
          onMobileMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
