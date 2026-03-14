"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Search, RefreshCw, Download } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import type { LiveRankingRow } from "./page";

interface RankingsViewProps {
  rankings: LiveRankingRow[];
  siteId: string;
  domain: string;
}

type SortField = "query" | "clicks" | "impressions" | "ctr" | "position";

function DeltaCell({ value, inverted }: { value: number; inverted?: boolean }) {
  // For position, negative delta (position went down numerically = improved) is good
  // But we already compute position_delta as positive = improved
  const isGood = inverted ? value < 0 : value > 0;
  const isBad = inverted ? value > 0 : value < 0;

  if (Math.abs(value) < 0.001) {
    return <span className="text-gray-400 text-xs flex items-center gap-0.5"><Minus className="h-3 w-3" /> —</span>;
  }

  return (
    <span className={cn("text-xs font-medium flex items-center gap-0.5", isGood ? "text-green-600" : isBad ? "text-red-600" : "text-gray-400")}>
      {isGood ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value) < 1 ? (Math.abs(value) * 100).toFixed(1) + "%" : formatNumber(Math.abs(value))}
    </span>
  );
}

export function RankingsView({ rankings, siteId, domain }: RankingsViewProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("impressions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = rankings
    .filter((r) => r.query.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortField] as number | string;
      const vb = b[sortField] as number | string;
      if (typeof va === "string") return sortDir === "desc" ? (vb as string).localeCompare(va) : va.localeCompare(vb as string);
      return sortDir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
    });

  const significantDrops = rankings.filter((r) => r.position_delta < -5);

  // KPI aggregates
  const totalClicks = rankings.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rankings.reduce((s, r) => s + r.impressions, 0);
  const avgCtr = rankings.length > 0 ? rankings.reduce((s, r) => s + r.ctr, 0) / rankings.length : 0;
  const avgPosition = rankings.length > 0 ? rankings.reduce((s, r) => s + r.position, 0) / rankings.length : 0;

  const totalClicksDelta = rankings.reduce((s, r) => s + r.clicks_delta, 0);
  const totalImpressionsDelta = rankings.reduce((s, r) => s + r.impressions_delta, 0);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      // Trigger a page refresh to re-fetch server component data
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  }

  function exportCsv() {
    const header = "query,clicks,impressions,ctr,position,clicks_delta,impressions_delta,position_delta\n";
    const rows = filtered.map((r) =>
      `"${r.query}",${r.clicks},${r.impressions},${(r.ctr * 100).toFixed(2)}%,${r.position.toFixed(1)},${r.clicks_delta},${r.impressions_delta},${r.position_delta.toFixed(1)}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rankings-${domain}.csv`;
    a.click();
  }

  const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      className={cn("cursor-pointer pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-900", className)}
      onClick={() => handleSort(field)}
    >
      {label} {sortField === field ? (sortDir === "desc" ? "↓" : "↑") : ""}
    </th>
  );

  if (rankings.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-gray-400">
          <p className="text-lg font-medium">No ranking data yet</p>
          <p className="mt-1 text-sm">GSC data may take a few days to appear after connecting. Check back soon.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Clicks"
          value={formatNumber(totalClicks)}
          description="Last 7 days"
          trend={totalClicksDelta !== 0 && totalClicks > 0 ? Math.round((totalClicksDelta / Math.max(totalClicks - totalClicksDelta, 1)) * 100) : undefined}
        />
        <KpiCard
          title="Total Impressions"
          value={formatNumber(totalImpressions)}
          description="Last 7 days"
          trend={totalImpressionsDelta !== 0 && totalImpressions > 0 ? Math.round((totalImpressionsDelta / Math.max(totalImpressions - totalImpressionsDelta, 1)) * 100) : undefined}
        />
        <KpiCard
          title="Avg CTR"
          value={(avgCtr * 100).toFixed(1) + "%"}
          description="Last 7 days"
        />
        <KpiCard
          title="Avg Position"
          value={avgPosition.toFixed(1)}
          description="Last 7 days"
        />
      </div>

      {/* Significant drops alert */}
      {significantDrops.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-700">
              {significantDrops.length} query{significantDrops.length > 1 ? "s" : ""} dropped significantly
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {significantDrops.slice(0, 3).map((r) => r.query).join(", ")}
              {significantDrops.length > 3 && ` +${significantDrops.length - 3} more`}
            </p>
          </div>
        </div>
      )}

      {/* Rankings table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Search Queries ({filtered.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search queries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <SortHeader field="query" label="Query" />
                  <SortHeader field="clicks" label="Clicks" />
                  <th className="pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                  <SortHeader field="impressions" label="Impressions" />
                  <th className="pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                  <SortHeader field="ctr" label="CTR" />
                  <SortHeader field="position" label="Position" />
                  <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.query} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium max-w-xs truncate" title={r.query}>{r.query}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatNumber(r.clicks)}</td>
                    <td className="py-3 pr-4"><DeltaCell value={r.clicks_delta} /></td>
                    <td className="py-3 pr-4 tabular-nums">{formatNumber(r.impressions)}</td>
                    <td className="py-3 pr-4"><DeltaCell value={r.impressions_delta} /></td>
                    <td className="py-3 pr-4 tabular-nums">{(r.ctr * 100).toFixed(1)}%</td>
                    <td className="py-3 pr-4 tabular-nums">{r.position.toFixed(1)}</td>
                    <td className="py-3"><DeltaCell value={r.position_delta} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No queries match your search.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
