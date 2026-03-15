"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Globe,
  Home,
  Key,
  LineChart,
  Settings,
  FileText,
  Zap,
  LogOut,
  Edit3,
  Box,
  Bot,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard/overview", label: "Overview", icon: Home },
  { href: "/dashboard/keywords", label: "Keywords", icon: Key },
  { href: "/dashboard/rankings", label: "Rankings", icon: LineChart },
  { href: "/dashboard/geo", label: "GEO / LLM", icon: Globe },
  { href: "/dashboard/ai-blogs", label: "AI Blogs", icon: Edit3 },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/agent-chat", label: "Agent Chat", icon: Bot },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = userRole === "admin";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-white/[0.06] bg-[#0a0a0a]">
      <div className="flex h-14 items-center px-5 border-b border-white/[0.06]">
        <Link href="/dashboard/overview" className="flex items-center gap-2.5">
          <Zap className="h-4 w-4 text-white" strokeWidth={1.5} />
          <span className="text-sm font-medium tracking-wide text-white">Crawl</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs transition-all duration-150",
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {isAdmin && (
            <li>
              <Link
                href="/sandbox/control"
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs transition-all duration-150",
                  pathname === "/sandbox/control"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                )}
              >
                <Box className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                Sandbox
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="border-t border-white/[0.06] p-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs text-white/30 transition-all duration-150 hover:bg-white/[0.04] hover:text-white/60"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
