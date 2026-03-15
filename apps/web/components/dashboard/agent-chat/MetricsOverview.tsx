"use client";

import { TrendingUp, TrendingDown, Target, Globe, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const metrics = [
  { id: "1", title: "SEO Score", value: "92", change: 12, icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "2", title: "GEO Coverage", value: "78%", change: 8, icon: Globe, color: "text-teal-400", bg: "bg-teal-500/10" },
  { id: "3", title: "Page Speed", value: "94", change: -2, icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: "4", title: "Mobile Traffic", value: "64%", change: 15, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
];

const chartData = [
  { month: "Jan", seo: 65, geo: 45 },
  { month: "Feb", seo: 70, geo: 50 },
  { month: "Mar", seo: 75, geo: 55 },
  { month: "Apr", seo: 80, geo: 60 },
  { month: "May", seo: 85, geo: 65 },
  { month: "Jun", seo: 90, geo: 70 },
  { month: "Jul", seo: 92, geo: 78 },
];

const topKeywords = [
  { keyword: "SEO optimization", position: 1, change: 3 },
  { keyword: "React SEO", position: 2, change: 1 },
  { keyword: "GEO targeting", position: 3, change: 5 },
  { keyword: "Technical SEO", position: 4, change: -1 },
  { keyword: "Local SEO", position: 5, change: 2 },
];

export default function MetricsOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.id} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/40">{metric.title}</p>
                <div className={cn("p-1.5 rounded-md", metric.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", metric.color)} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{metric.value}</span>
                <div className={cn("flex items-center text-xs font-medium", metric.change >= 0 ? "text-green-400" : "text-red-400")}>
                  {metric.change >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {metric.change >= 0 ? "+" : ""}{metric.change}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white mb-1">SEO & GEO Performance</p>
          <p className="text-xs text-white/40 mb-4">Monthly improvement metrics</p>
          <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500" /><span>SEO Score</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-teal-500" /><span>GEO Coverage</span></div>
          </div>
          <div className="h-48 flex items-end gap-1">
            {chartData.map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="flex items-end gap-0.5 w-full justify-center">
                  <div className="w-3 bg-blue-500 rounded-t opacity-80" style={{ height: `${(data.seo / 100) * 160}px` }} />
                  <div className="w-3 bg-teal-500 rounded-t opacity-80" style={{ height: `${(data.geo / 100) * 160}px` }} />
                </div>
                <div className="text-[10px] text-white/30">{data.month}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white mb-1">Top Keywords</p>
          <p className="text-xs text-white/40 mb-4">Ranking performance</p>
          <div className="space-y-2">
            {topKeywords.map((item) => (
              <div key={item.keyword} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", item.position <= 3 ? "bg-green-500/20 text-green-400" : "bg-white/[0.06] text-white/40")}>
                    {item.position}
                  </div>
                  <span className="text-sm text-white/70">{item.keyword}</span>
                </div>
                <div className={cn("flex items-center text-xs font-medium", item.change >= 0 ? "text-green-400" : "text-red-400")}>
                  {item.change >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {item.change >= 0 ? "+" : ""}{item.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white mb-4">Agent Performance</p>
          <div className="space-y-3">
            {[
              { name: "Repo Reader", pct: 95, color: "bg-green-500" },
              { name: "Optimizer", pct: 92, color: "bg-blue-500" },
              { name: "QA Reviewer", pct: 89, color: "bg-amber-500" },
              { name: "Publisher", pct: 96, color: "bg-purple-500" },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center justify-between gap-3">
                <span className="text-xs text-white/60 w-24 shrink-0">{agent.name}</span>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", agent.color)} style={{ width: `${agent.pct}%` }} />
                </div>
                <span className="text-xs font-medium text-white/60 w-8 text-right">{agent.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white mb-1">Recent Optimizations</p>
          <p className="text-xs text-white/40 mb-4">Latest completed projects</p>
          <div className="space-y-3">
            {[
              { name: "testrepo-themostbroken", type: "SEO + GEO", time: "2 hours ago", status: "Completed", delta: "+92% SEO", statusColor: "text-green-400 bg-green-500/10" },
              { name: "ecommerce-platform", type: "GEO Only", time: "1 day ago", status: "In Progress", delta: "+65%", statusColor: "text-blue-400 bg-blue-500/10" },
              { name: "portfolio-site", type: "SEO Only", time: "3 days ago", status: "Completed", delta: "+78% SEO", statusColor: "text-green-400 bg-green-500/10" },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-md border border-white/[0.06]">
                <div>
                  <div className="text-sm font-medium text-white">{item.name}</div>
                  <div className="text-xs text-white/40">{item.type} • {item.time}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 text-[10px] rounded-full font-medium", item.statusColor)}>{item.status}</span>
                  <span className="text-xs font-medium text-white/60">{item.delta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
