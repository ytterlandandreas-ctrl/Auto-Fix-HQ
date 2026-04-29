import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import type { ShopInsight } from "@/lib/analytics-engine";

const STYLES = {
  success: { bg: "bg-green-50 border-green-200", icon: CheckCircle, iconColor: "text-green-500", titleColor: "text-green-800" },
  warning: { bg: "bg-amber-50 border-amber-200", icon: AlertTriangle, iconColor: "text-amber-500", titleColor: "text-amber-800" },
  danger: { bg: "bg-red-50 border-red-200", icon: XCircle, iconColor: "text-red-500", titleColor: "text-red-800" },
  info: { bg: "bg-blue-50 border-blue-200", icon: Info, iconColor: "text-blue-500", titleColor: "text-blue-800" },
};

export function InsightCard({ insight }: { insight: ShopInsight }) {
  const style = STYLES[insight.type];
  const Icon = style.icon;

  return (
    <div className={cn("rounded-xl border p-4 space-y-2", style.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", style.iconColor)} />
        <div className="space-y-1">
          <p className={cn("font-semibold text-sm", style.titleColor)}>{insight.title}</p>
          <p className="text-sm text-slate-600">{insight.message}</p>
        </div>
      </div>
      {insight.actionLabel && insight.actionHref && (
        <div className="pl-8">
          <Link
            href={insight.actionHref}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2"
          >
            {insight.actionLabel} →
          </Link>
        </div>
      )}
    </div>
  );
}
