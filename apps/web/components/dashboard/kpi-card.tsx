import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KpiCard({
  title,
  value,
  description,
  trend,
  trendLabel,
  icon,
  className,
}: KpiCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        "rounded-lg border border-white/[0.06] bg-white/[0.02] p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-white/30">{title}</p>
        {icon && <div className="text-white/20">{icon}</div>}
      </div>
      <div className="mt-3 text-3xl font-light text-white">{value}</div>
      {(description || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-1 text-xs text-white/30">
          {trend !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 font-medium",
                isPositive && "text-emerald-400",
                isNegative && "text-red-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : isNegative ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {Math.abs(trend)}%
            </span>
          )}
          {trendLabel && <span>{trendLabel}</span>}
          {description && !trendLabel && <span>{description}</span>}
        </div>
      )}
    </div>
  );
}
