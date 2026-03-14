import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/10 text-white/70",
        secondary: "border-white/[0.06] bg-white/[0.04] text-white/40",
        destructive: "border-red-500/20 bg-red-500/10 text-red-400",
        outline: "border-white/10 text-white/50",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
