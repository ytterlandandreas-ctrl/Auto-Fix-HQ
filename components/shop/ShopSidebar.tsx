"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Car,
  FileText,
  Receipt,
  Camera,
  Calendar,
  Package,
  UserCog,
  MessageSquare,
  Target,
  Wrench,
  BarChart3,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";

interface NavItem {
  href: string;
  labelKey: keyof ReturnType<typeof useT>["nav"];
  icon: React.ElementType;
  addon?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/shop/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/shop/repair-orders", labelKey: "repairOrders", icon: ClipboardList },
  { href: "/shop/customers", labelKey: "customers", icon: Users },
  { href: "/shop/vehicles", labelKey: "vehicles", icon: Car },
  { href: "/shop/appointments", labelKey: "appointments", icon: Calendar },
  { href: "/shop/estimates", labelKey: "estimates", icon: FileText },
  { href: "/shop/invoices", labelKey: "invoices", icon: Receipt },
  { href: "/shop/inspections", labelKey: "inspections", icon: Camera },
  { href: "/shop/technicians", labelKey: "technicians", icon: UserCog },
  { href: "/shop/inventory", labelKey: "inventory", icon: Package },
  { href: "/shop/communications", labelKey: "communications", icon: MessageSquare },
  { href: "/shop/crm", labelKey: "crm", icon: Target, addon: "crm" },
  { href: "/shop/collision", labelKey: "collision", icon: Wrench, addon: "collision" },
  { href: "/shop/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/shop/integrations", labelKey: "integrations", icon: Plug },
  { href: "/shop/settings", labelKey: "settings", icon: Settings },
];

export default function ShopSidebar({
  shop,
  activeAddons,
  userRole,
  mobileOpen,
  onMobileClose,
}: {
  shop: { name: string; logoUrl?: string | null };
  activeAddons: string[];
  userRole: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.addon || activeAddons.includes(item.addon)
  );

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]); // eslint-disable-line

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-slate-900 text-white transition-all duration-300 z-50",
          // Desktop: persistent sidebar
          "lg:relative lg:flex-shrink-0",
          collapsed ? "lg:w-16" : "lg:w-56",
          // Mobile: off-canvas drawer
          "fixed top-0 left-0 h-full w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo + mobile close */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700 h-16">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm truncate flex-1">{shop.name}</span>
          )}
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden text-slate-400 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{t.nav[item.labelKey]}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-slate-700 text-slate-400 hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>
    </>
  );
}
