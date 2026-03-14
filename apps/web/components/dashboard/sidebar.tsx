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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard/overview", label: "Overview", icon: Home },
  { href: "/dashboard/keywords", label: "Keywords", icon: Key },
  { href: "/dashboard/rankings", label: "Rankings", icon: LineChart },
  { href: "/dashboard/geo", label: "GEO / LLM", icon: Globe },
  { href: "/dashboard/ai-blogs", label: "AI-optimized blogs", icon: Edit3 },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-900">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard/overview" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold">SEOClaw</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-gray-600"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
