"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, User, Wifi, WifiOff, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function ShopHeader({
  shop,
  user,
  onMobileMenuClick,
}: {
  shop: { name: string };
  user: { name?: string | null; email?: string | null };
  onMobileMenuClick?: () => void;
}) {
  const t = useT();
  const [online, setOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile shop name (visible when sidebar hidden) */}
        <span className="lg:hidden font-bold text-sm text-slate-900 truncate">{shop.name}</span>

        {/* Online/offline status */}
        {!online && (
          <div className="hidden sm:flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.misc.offlineQueued}</span>
            <span className="md:hidden">{t.misc.offlineStatus}</span>
            {pendingSync > 0 && ` (${pendingSync})`}
          </div>
        )}
        {!online && (
          <div className="sm:hidden flex items-center gap-1 text-amber-600">
            <WifiOff className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <LanguageSwitcher compact />

        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-1.5 sm:px-2 py-1 sm:py-1.5 transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-slate-900 leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500 leading-tight truncate max-w-[160px]">{user.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs font-normal text-slate-500 truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/shop/settings">
                <User className="w-4 h-4 mr-2" /> {t.nav.settings}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4 mr-2" /> {t.nav.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
