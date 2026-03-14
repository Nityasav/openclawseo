"use client";

import { cn } from "@/lib/utils";

interface UniqueLoadingProps {
  variant?: "morph";
  size?: "sm" | "md" | "lg";
  /** Use light (white) dots for dark backgrounds; dark (black) dots for light backgrounds. Default true (white on dark). */
  lightDots?: boolean;
  className?: string;
}

export default function UniqueLoading({
  variant = "morph",
  size = "md",
  lightDots = true,
  className,
}: UniqueLoadingProps) {
  const containerSizes = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const dotColor = lightDots ? "bg-white" : "bg-black";

  if (variant === "morph") {
    return (
      <div className={cn("relative flex items-center justify-center mx-auto", containerSizes[size], className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn("absolute w-4 h-4", dotColor)}
              style={{
                animation: `morph-${i} 2s infinite ease-in-out`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
