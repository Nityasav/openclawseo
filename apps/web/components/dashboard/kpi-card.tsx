import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {trend !== undefined && (
              <span
                className={cn(
                  "flex items-center gap-0.5 font-medium",
                  isPositive && "text-green-600",
                  isNegative && "text-red-600"
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
      </CardContent>
    </Card>
  );
}
