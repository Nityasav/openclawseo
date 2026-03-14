"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface DeltaBadgeProps {
  delta: number;
  label?: string;
}

export function DeltaBadge({ delta, label }: DeltaBadgeProps) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
        isPositive && "bg-emerald-500/10 text-emerald-400",
        isNegative && "bg-red-500/10 text-red-400",
        !isPositive && !isNegative && "bg-white/[0.04] text-white/30"
      )}
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : isNegative ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {delta !== 0 ? Math.abs(delta).toFixed(1) : "—"}
      {label && <span className="ml-0.5">{label}</span>}
    </span>
  );
}

// Keep SparklineChart export for backward compatibility if imported elsewhere
export { DeltaBadge as SparklineChart };
