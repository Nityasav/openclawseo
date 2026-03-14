import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-white/20 file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-none focus-visible:border-white/20 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
