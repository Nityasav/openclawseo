"use client";

import { Bell } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({ title, description, actions }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a] px-6 py-4">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-base font-light tracking-wide text-white">{title}</h1>
        {description && (
          <p className="mt-0.5 text-xs text-white/30">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 animate-in fade-in duration-500">
        {actions}
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60">
          <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
