"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { BarChart3, Clock, Globe, Key, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { formatNumber, getPositionBadgeColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SyntheticSite } from "@/lib/sandbox/generator";

interface DemoInterfaceProps {
  data: SyntheticSite;
  expiresAt: string;
  sandboxId: string;
}

function ExpiryTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m remaining`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-amber-400">
      <Clock className="h-4 w-4 shrink-0" />
      {timeLeft}
    </div>
  );
}

export function DemoInterface({ data, expiresAt, sandboxId }: DemoInterfaceProps) {
  const [activating, setActivating] = useState(false);

  const totalKeywords = data.keywords.length;
  const avgPosition = Math.round(data.keywords.reduce((s, k) => s + k.current_position, 0) / totalKeywords);
  const quickWins = data.keywords.filter((k) => k.current_position >= 11 && k.current_position <= 15);
  const criticalDrops = data.keywords.filter((k) => k.delta < -5);

  const totalSessions = data.ga4_data.reduce((s, d) => s + d.sessions, 0);
  const organicSessions = data.ga4_data.reduce((s, d) => s + d.organic_sessions, 0);
  const organicShare = totalSessions > 0 ? Math.round((organicSessions / totalSessions) * 100) : 0;

  async function handleActivate() {
    setActivating(true);
    const res = await fetch(`/api/v1/sandbox/${sandboxId}/migrate`, { method: "POST" });
    const result = await res.json();
    if (result.success && result.data?.redirect_to) {
      window.location.href = result.data.redirect_to;
    }
    setActivating(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Demo top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="warning" className="text-xs font-semibold">DEMO MODE</Badge>
          <span className="text-sm text-white/80">
            Showing synthetic data for <strong className="text-white">{data.domain}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ExpiryTimer expiresAt={expiresAt} />
          <Button onClick={handleActivate} disabled={activating} size="sm">
            {activating ? "Activating..." : "Activate Live Account"}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a] px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-white" strokeWidth={1.5} />
          <h1 className="text-xl font-bold text-white">Crawl</h1>
          <span className="text-white/50">/ Overview</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Alerts */}
        {criticalDrops.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <TrendingDown className="mt-0.5 h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-red-300">
                {criticalDrops.length} keywords dropped significantly
              </p>
              <p className="text-sm text-red-400/90 mt-1">
                {criticalDrops.slice(0, 3).map((k) => `"${k.keyword}" (↓${Math.abs(k.delta)} pos)`).join(", ")}
              </p>
            </div>
          </div>
        )}

        {quickWins.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <TrendingUp className="mt-0.5 h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-300">
                {quickWins.length} quick win opportunities (pos 11-15)
              </p>
              <p className="text-sm text-emerald-400/90 mt-1">
                {quickWins.slice(0, 3).map((k) => `"${k.keyword}"`).join(", ")} — push to top 10 with minor fixes
              </p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Keywords Tracked" value={formatNumber(totalKeywords)} icon={<Key className="h-4 w-4" />} />
          <KpiCard title="Avg. Position" value={avgPosition} description="across all keywords" icon={<BarChart3 className="h-4 w-4" />} />
          <KpiCard title="Monthly Sessions" value={formatNumber(totalSessions)} description={`${organicShare}% organic`} icon={<Globe className="h-4 w-4" />} />
          <KpiCard title="Quick Wins" value={quickWins.length} description="keywords at positions 11-15" trend={quickWins.length > 0 ? 100 : 0} trendLabel="opportunities" icon={<TrendingUp className="h-4 w-4" />} />
        </div>

        {/* Top Keywords */}
        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-white">Top Keywords by Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-white/50">
                    <th className="pb-3 pl-4 pr-4 pt-3">Keyword</th>
                    <th className="pb-3 pr-4">Position</th>
                    <th className="pb-3 pr-4">Change</th>
                    <th className="pb-3 pr-4">Volume</th>
                    <th className="pb-3 pr-4">Opportunity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {data.keywords.slice(0, 15).map((kw) => (
                    <tr key={kw.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pl-4 pr-4 font-medium text-white/90">{kw.keyword}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", getPositionBadgeColor(kw.current_position))}>
                          #{kw.current_position}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn("text-xs font-medium", kw.delta > 0 ? "text-emerald-400" : kw.delta < 0 ? "text-red-400" : "text-white/40")}>
                          {kw.delta > 0 ? `↑${kw.delta}` : kw.delta < 0 ? `↓${Math.abs(kw.delta)}` : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-white/70">{formatNumber(kw.search_volume)}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${kw.opportunity_score}%` }} />
                          </div>
                          <span className="text-xs text-white/70">{Math.round(kw.opportunity_score)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Activate CTA */}
        <Card className="border-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white">
          <CardContent className="py-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-white">Ready to see your real data?</h2>
            <p className="mb-6 text-blue-100">
              Connect your Google Search Console and see the same insights for your actual site.
            </p>
            <Button
              size="lg"
              onClick={handleActivate}
              disabled={activating}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Activate Live Account — Free
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
