"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Search, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type {
  LiveRankingRow,
  PageRow,
  DateRow,
  DeviceRow,
  CountryRow,
  QueryPageRow,
} from "./page";
import { useRouter } from "next/navigation";

interface RankingsViewProps {
  rankings: LiveRankingRow[];
  pages: PageRow[];
  dailyData: DateRow[];
  devices: DeviceRow[];
  countries: CountryRow[];
  queryPages: QueryPageRow[];
  siteId: string;
  domain: string;
}

type QuerySortField = keyof Pick<LiveRankingRow, "query" | "clicks" | "impressions" | "ctr" | "position">;
type PageSortField = keyof Pick<PageRow, "page" | "clicks" | "impressions" | "ctr" | "position">;

function fmt(n: number, decimals = 0) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(decimals);
}

function pct(n: number) {
  return (n * 100).toFixed(2) + "%";
}

function getPositionBadgeColor(position: number) {
  if (position <= 3) return "border-green-400 text-green-700 bg-green-50";
  if (position <= 10) return "border-blue-400 text-blue-700 bg-blue-50";
  if (position <= 20) return "border-yellow-400 text-yellow-700 bg-yellow-50";
  return "border-gray-300 text-gray-500";
}

function DeltaCell({ value, inverted = false }: { value: number; inverted?: boolean }) {
  if (Math.abs(value) < 0.0001) {
    return <span className="text-gray-300 text-xs flex items-center"><Minus className="h-3 w-3" /></span>;
  }
  const good = inverted ? value > 0 : value > 0;
  const label = Math.abs(value) < 1 ? (Math.abs(value) * 100).toFixed(1) + "%" : fmt(Math.abs(value));
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", good ? "text-green-600" : "text-red-500")}>
      {good ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {label}
    </span>
  );
}

function PositionBadge({ position }: { position: number }) {
  return (
    <Badge variant="outline" className={cn("text-xs tabular-nums", getPositionBadgeColor(position))}>
      {position.toFixed(1)}
    </Badge>
  );
}

export function RankingsView({ rankings, pages, dailyData, devices, countries, queryPages, siteId, domain }: RankingsViewProps) {
  const [querySearch, setQuerySearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [querySortField, setQuerySortField] = useState<QuerySortField>("impressions");
  const [querySortDir, setQuerySortDir] = useState<"asc" | "desc">("desc");
  const [pageSortField, setPageSortField] = useState<PageSortField>("clicks");
  const [pageSortDir, setPageSortDir] = useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Aggregate KPIs
  const totalClicks = rankings.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rankings.reduce((s, r) => s + r.impressions, 0);
  const avgCtr = rankings.length > 0 ? rankings.reduce((s, r) => s + r.ctr, 0) / rankings.length : 0;
  const avgPosition = rankings.length > 0 ? rankings.reduce((s, r) => s + r.position, 0) / rankings.length : 0;
  const totalClicksDelta = rankings.reduce((s, r) => s + r.clicks_delta, 0);
  const totalImpressionsDelta = rankings.reduce((s, r) => s + r.impressions_delta, 0);
  const totalPages = pages.length;
  const pagesWithClicks = pages.filter((p) => p.clicks > 0).length;
  const deviceCount = devices.length;
  const countryCount = countries.length;

  // Position buckets
  const positionBuckets = useMemo(() => {
    const buckets = { top3: 0, top10: 0, top20: 0, beyond: 0 };
    for (const r of rankings) {
      if (r.position <= 3) buckets.top3++;
      else if (r.position <= 10) buckets.top10++;
      else if (r.position <= 20) buckets.top20++;
      else buckets.beyond++;
    }
    return buckets;
  }, [rankings]);

  const significantDrops = rankings.filter((r) => r.position_delta < -5);
  const significantGains = rankings.filter((r) => r.position_delta > 5);
  const lowCtrOpps = rankings.filter((r) => r.position <= 10 && r.ctr < 0.02 && r.impressions > 50);

  // Filtered + sorted queries
  const filteredQueries = useMemo(() => {
    return rankings
      .filter((r) => r.query.toLowerCase().includes(querySearch.toLowerCase()))
      .sort((a, b) => {
        const va = a[querySortField]; const vb = b[querySortField];
        if (typeof va === "string") return querySortDir === "desc" ? (vb as string).localeCompare(va) : va.localeCompare(vb as string);
        return querySortDir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
      });
  }, [rankings, querySearch, querySortField, querySortDir]);

  // Filtered + sorted pages
  const filteredPages = useMemo(() => {
    return pages
      .filter((r) => r.page.toLowerCase().includes(pageSearch.toLowerCase()))
      .sort((a, b) => {
        const va = a[pageSortField]; const vb = b[pageSortField];
        if (typeof va === "string") return pageSortDir === "desc" ? (vb as string).localeCompare(va) : va.localeCompare(vb as string);
        return pageSortDir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
      });
  }, [pages, pageSearch, pageSortField, pageSortDir]);

  function handleQuerySort(field: QuerySortField) {
    if (field === querySortField) setQuerySortDir((d) => d === "asc" ? "desc" : "asc");
    else { setQuerySortField(field); setQuerySortDir("desc"); }
  }

  function handlePageSort(field: PageSortField) {
    if (field === pageSortField) setPageSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setPageSortField(field); setPageSortDir("desc"); }
  }

  function SortTh({ field, label, onSort, sortField, sortDir, className }: {
    field: string; label: string; onSort: (f: string) => void;
    sortField: string; sortDir: string; className?: string;
  }) {
    return (
      <th
        className={cn("cursor-pointer select-none whitespace-nowrap pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-800", className)}
        onClick={() => onSort(field)}
      >
        {label} {sortField === field ? (sortDir === "desc" ? "↓" : "↑") : <span className="text-gray-300">↕</span>}
      </th>
    );
  }

  function exportCsv(type: "queries" | "pages") {
    if (type === "queries") {
      const header = "query,clicks,impressions,ctr,avg_position,clicks_delta,impressions_delta,position_delta\n";
      const rows = filteredQueries.map((r) =>
        `"${r.query}",${r.clicks},${r.impressions},${pct(r.ctr)},${r.position.toFixed(1)},${r.clicks_delta},${r.impressions_delta},${r.position_delta.toFixed(1)}`
      ).join("\n");
      const blob = new Blob([header + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${domain}-queries.csv`; a.click();
    } else {
      const header = "page,clicks,impressions,ctr,avg_position,indexed\n";
      const rows = filteredPages.map((r) =>
        `"${r.page}",${r.clicks},${r.impressions},${pct(r.ctr)},${r.position.toFixed(1)},${r.impressions > 0 ? "yes" : "unknown"}`
      ).join("\n");
      const blob = new Blob([header + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${domain}-pages.csv`; a.click();
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1500);
  }

  if (rankings.length === 0 && pages.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-gray-400">
          <p className="text-lg font-medium">No GSC data yet</p>
          <p className="mt-1 text-sm">Data can take a few days to appear after connecting. Check back soon.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Clicks", value: fmt(totalClicks), delta: totalClicksDelta, sub: "last 28 days" },
          { label: "Total Impressions", value: fmt(totalImpressions), delta: totalImpressionsDelta, sub: "last 28 days" },
          { label: "Avg CTR", value: pct(avgCtr), delta: null, sub: "last 28 days" },
          { label: "Avg Position", value: avgPosition.toFixed(1), delta: null, sub: `${rankings.length} queries` },
        ].map(({ label, value, delta, sub }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
              <div className="mt-1 flex items-center gap-1">
                {delta !== null && <DeltaCell value={delta} />}
                <span className="text-xs text-gray-400">{sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Position buckets */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Top 3", count: positionBuckets.top3, color: "bg-green-50 border-green-200 text-green-800" },
          { label: "Top 4–10", count: positionBuckets.top10, color: "bg-blue-50 border-blue-200 text-blue-800" },
          { label: "Pos 11–20", count: positionBuckets.top20, color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
          { label: "Pos 21+", count: positionBuckets.beyond, color: "bg-gray-50 border-gray-200 text-gray-600" },
        ].map(({ label, count, color }) => (
          <div key={label} className={cn("rounded-lg border p-3 text-center", color)}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
            <p className="text-xs opacity-60">{rankings.length > 0 ? Math.round((count / rankings.length) * 100) : 0}%</p>
          </div>
        ))}
      </div>

      {/* Pages indexed */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>📄 <strong>{totalPages}</strong> pages with impressions/clicks from Search</span>
        <span>🖱️ <strong>{pagesWithClicks}</strong> pages with clicks</span>
        <span>📉 <strong>{totalPages - pagesWithClicks}</strong> pages with 0 clicks (impressions only)</span>
        <span>📱 <strong>{deviceCount}</strong> devices</span>
        <span>🌎 <strong>{countryCount}</strong> countries</span>
      </div>

      {/* Alerts */}
      {significantDrops.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <p className="font-semibold text-orange-800">{significantDrops.length} queries dropped &gt;5 positions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {significantDrops.slice(0, 5).map((r) => (
              <Badge key={r.query} variant="outline" className="border-orange-300 text-orange-700 text-xs">
                {r.query.slice(0, 35)} ({r.position_delta.toFixed(1)})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {lowCtrOpps.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-5 w-5 text-blue-600" />
            <p className="font-semibold text-blue-800">{lowCtrOpps.length} CTR opportunities — top 10 but CTR &lt; 2%</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowCtrOpps.slice(0, 5).map((r) => (
              <Badge key={r.query} variant="outline" className="border-blue-300 text-blue-700 text-xs">
                {r.query.slice(0, 35)} (pos {r.position.toFixed(1)}, {pct(r.ctr)})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Trend chart */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Trend</CardTitle>
            <CardDescription>Daily clicks & impressions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData.map((d) => ({ ...d, date: d.date.slice(5) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="l" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} dot={false} name="Clicks" />
                <Line yAxisId="r" type="monotone" dataKey="impressions" stroke="#93c5fd" strokeWidth={1.5} dot={false} name="Impressions" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Queries + Pages + Query/Page tabs */}
      <Tabs defaultValue="queries">
        <TabsList>
          <TabsTrigger value="queries">Queries ({filteredQueries.length})</TabsTrigger>
          <TabsTrigger value="pages">Pages ({filteredPages.length})</TabsTrigger>
          <TabsTrigger value="queryPages">Query × Page ({queryPages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="queries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Search Queries</CardTitle>
                <CardDescription>All keywords — clicks, impressions, CTR, avg position vs previous 28 days</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => exportCsv("queries")}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Filter queries..." value={querySearch} onChange={(e) => setQuerySearch(e.target.value)} className="pl-9" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <SortTh field="query" label="Query" onSort={(f) => handleQuerySort(f as QuerySortField)} sortField={querySortField} sortDir={querySortDir} className="min-w-[180px]" />
                      <SortTh field="clicks" label="Clicks" onSort={(f) => handleQuerySort(f as QuerySortField)} sortField={querySortField} sortDir={querySortDir} />
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase text-gray-500">Δ</th>
                      <SortTh field="impressions" label="Impressions" onSort={(f) => handleQuerySort(f as QuerySortField)} sortField={querySortField} sortDir={querySortDir} />
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase text-gray-500">Δ</th>
                      <SortTh field="ctr" label="CTR" onSort={(f) => handleQuerySort(f as QuerySortField)} sortField={querySortField} sortDir={querySortDir} />
                      <SortTh field="position" label="Avg Pos" onSort={(f) => handleQuerySort(f as QuerySortField)} sortField={querySortField} sortDir={querySortDir} />
                      <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredQueries.map((r) => (
                      <tr key={r.query} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-medium max-w-xs truncate" title={r.query}>{r.query}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-2.5 pr-4"><DeltaCell value={r.clicks_delta} /></td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-2.5 pr-4"><DeltaCell value={r.impressions_delta} /></td>
                        <td className="py-2.5 pr-4 tabular-nums">{pct(r.ctr)}</td>
                        <td className="py-2.5 pr-4"><PositionBadge position={r.position} /></td>
                        <td className="py-2.5"><DeltaCell value={r.position_delta} inverted /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredQueries.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No queries match.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Pages</CardTitle>
                <CardDescription>Indexed pages with impressions/clicks from Google Search</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => exportCsv("pages")}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Filter pages..." value={pageSearch} onChange={(e) => setPageSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <SortTh field="page" label="Page URL" onSort={(f) => handlePageSort(f as PageSortField)} sortField={pageSortField} sortDir={pageSortDir} className="min-w-[220px]" />
                      <SortTh field="clicks" label="Clicks" onSort={(f) => handlePageSort(f as PageSortField)} sortField={pageSortField} sortDir={pageSortDir} />
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase text-gray-500">Δ</th>
                      <SortTh field="impressions" label="Impressions" onSort={(f) => handlePageSort(f as PageSortField)} sortField={pageSortField} sortDir={pageSortDir} />
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase text-gray-500">Δ</th>
                      <SortTh field="ctr" label="CTR" onSort={(f) => handlePageSort(f as PageSortField)} sortField={pageSortField} sortDir={pageSortDir} />
                      <SortTh field="position" label="Avg Pos" onSort={(f) => handlePageSort(f as PageSortField)} sortField={pageSortField} sortDir={pageSortDir} />
                      <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">Indexed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPages.map((r) => (
                      <tr key={r.page} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-mono text-xs max-w-sm truncate text-blue-700" title={r.page}>
                          <a href={r.page} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {r.page.replace(/^https?:\/\/[^/]+/, "") || "/"}
                          </a>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-2.5 pr-4"><DeltaCell value={r.clicks_delta} /></td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-2.5 pr-4"><DeltaCell value={r.impressions_delta} /></td>
                        <td className="py-2.5 pr-4 tabular-nums">{pct(r.ctr)}</td>
                        <td className="py-2.5 pr-4"><PositionBadge position={r.position} /></td>
                        <td className="py-2.5">
                          {r.impressions > 0
                            ? <Badge variant="outline" className="border-green-300 text-green-700 text-xs">Search-visible</Badge>
                            : <Badge variant="outline" className="text-xs text-gray-400">No impressions</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPages.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No pages match.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queryPages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Query × Page Pairs</CardTitle>
                <CardDescription>Every query + landing page combination reported by GSC</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase text-gray-500 min-w-[160px]">Query</th>
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase text-gray-500 min-w-[220px]">Page</th>
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase text-gray-500">Clicks</th>
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase text-gray-500">Impressions</th>
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase text-gray-500">CTR</th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">Avg Pos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {queryPages.map((r) => (
                      <tr key={`${r.query}-${r.page}`} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 max-w-xs truncate" title={r.query}>{r.query}</td>
                        <td className="py-2.5 pr-4 font-mono text-xs max-w-sm truncate text-blue-700" title={r.page}>
                          <a href={r.page} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {r.page.replace(/^https?:\/\/[^/]+/, "") || "/"}
                          </a>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{pct(r.ctr)}</td>
                        <td className="py-2.5"><PositionBadge position={r.position} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {queryPages.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No query/page combinations.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
