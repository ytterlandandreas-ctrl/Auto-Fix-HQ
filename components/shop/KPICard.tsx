import { cn } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

const COLORS = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  yellow: "bg-yellow-50 text-yellow-600",
  red: "bg-red-50 text-red-600",
};

export function KPICard({
  label,
  value,
  icon: Icon,
  color = "blue",
  change,
  href,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color?: keyof typeof COLORS;
  change?: number;
  href?: string;
}) {
  const card = (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-3 sm:p-5 space-y-2 sm:space-y-3",
        href && "hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-medium text-slate-500 truncate">{label}</span>
        <span className={cn("p-1.5 sm:p-2 rounded-lg flex-shrink-0", COLORS[color])}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{value}</span>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              change >= 0 ? "text-green-600" : "text-red-500"
            )}
          >
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}
