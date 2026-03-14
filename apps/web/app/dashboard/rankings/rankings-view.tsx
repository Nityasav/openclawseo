"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Search,
  RefreshCw, Download, FileText, Globe, BarChart3, TrendingUp, TrendingDown, Eye, MousePointerClick,
} from "lucide-react";
import { cn, formatNumber, getPositionBadgeColor } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import type { LiveRankingRow, PageRow, DateRow } from "./page";

interface RankingsViewProps {
  rankings: LiveRankingRow[];
  pages: PageRow[];
  dailyData: DateRow[];
  siteId: string;
  domain: string;
}

type QuerySortField = "query" | "clicks" | "impressions" | "ctr" | "position";
type PageSortField = "page" | "clicks" | "impressions" | "ctr" | "position";

function DeltaCell({ value, inverted }: { value: number; inverted?: boolean }) {
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

function PositionBadge({ position }: { position: number }) {
  return (
    <Badge variant="outline" className={cn("text-xs tabular-nums", getPositionBadgeColor(position))}>
      {position.toFixed(1)}
    </Badge>
  );
}

export function RankingsView({ rankings, pages, dailyData, siteId, domain }: RankingsViewProps) {
  const [querySearch, setQuerySearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [querySortField, setQuerySortField] = useState<QuerySortField>("impressions");
  const [querySortDir, setQuerySortDir] = useState<"asc" | "desc">("desc");
  const [pageSortField, setPageSortField] = useState<PageSortField>("impressions");
  const [pageSortDir, setPageSortDir] = useState<"asc" | "desc">("desc");

  // KPI aggregates
  const totalClicks = rankings.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rankings.reduce((s, r) => s + r.impressions, 0);
  const avgCtr = rankings.length > 0 ? rankings.reduce((s, r) => s + r.ctr, 0) / rankings.length : 0;
  const avgPosition = rankings.length > 0 ? rankings.reduce((s, r) => s + r.position, 0) / rankings.length : 0;
  const totalClicksDelta = rankings.reduce((s, r) => s + r.clicks_delta, 0);
  const totalImpressionsDelta = rankings.reduce((s, r) => s + r.impressions_delta, 0);
  const totalPages = pages.length;
  const pagesWithClicks = pages.filter((p) => p.clicks > 0).length;

  // Position distribution
  const positionBuckets = useMemo(() => {
    const buckets = { top3: 0, top10: 0, top20: 0, top50: 0, beyond: 0 };
    for (const r of rankings) {
      if (r.position <= 3) buckets.top3++;
      else if (r.position <= 10) buckets.top10++;
      else if (r.position <= 20) buckets.top20++;
      else if (r.position <= 50) buckets.top50++;
      else buckets.beyond++;
    }
    return [
      { name: "Top 3", count: buckets.top3, fill: "#10b981" },
      { name: "4-10", count: buckets.top10, fill: "#3b82f6" },
      { name: "11-20", count: buckets.top20, fill: "#f59e0b" },
      { name: "21-50", count: buckets.top50, fill: "#f97316" },
      { name: "50+", count: buckets.beyond, fill: "#ef4444" },
    ];
  }, [rankings]);

  const significantDrops = rankings.filter((r) => r.position_delta < -5);
  const significantGains = rankings.filter((r) => r.position_delta > 5);

  // Filtered & sorted queries
  const filteredQueries = useMemo(() => {
    return rankings
      .filter((r) => r.query.toLowerCase().includes(querySearch.toLowerCase()))
      .sort((a, b) => {
        const va = a[querySortField];
        const vb = b[querySortField];
        if (typeof va === "string") return querySortDir === "desc" ? (vb as string).localeCompare(va) : va.localeCompare(vb as string);
        return querySortDir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
      });
  }, [rankings, querySearch, querySortField, querySortDir]);

  // Filtered & sorted pages
  const filteredPages = useMemo(() => {
    return pages
      .filter((p) => p.page.toLowerCase().includes(pageSearch.toLowerCase()))
      .sort((a, b) => {
        const va = a[pageSortField];
        const vb = b[pageSortField];
        if (typeof va === "string") return pageSortDir === "desc" ? (vb as string).localeCompare(va) : va.localeCompare(vb as string);
        return pageSortDir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
      });
  }, [pages, pageSearch, pageSortField, pageSortDir]);

  // Chart data
  const chartData = useMemo(() => {
    return dailyData.map((d) => ({
      date: d.date.slice(5), // "MM-DD"
      clicks: d.clicks,
      impressions: d.impressions,
      ctr: +(d.ctr * 100).toFixed(2),
      position: +d.position.toFixed(1),
    }));
  }, [dailyData]);

  function handleQuerySort(field: QuerySortField) {
    if (querySortField === field) setQuerySortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setQuerySortField(field); setQuerySortDir("desc"); }
  }

  function handlePageSort(field: PageSortField) {
    if (pageSortField === field) setPageSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setPageSortField(field); setPageSortDir("desc"); }
  }

  function exportCsv(type: "queries" | "pages") {
    if (type === "queries") {
      const header = "query,clicks,impressions,ctr,position,clicks_delta,impressions_delta,position_delta\n";
      const rows = filteredQueries.map((r) =>
        `"${r.query}",${r.clicks},${r.impressions},${(r.ctr * 100).toFixed(2)}%,${r.position.toFixed(1)},${r.clicks_delta},${r.impressions_delta},${r.position_delta.toFixed(1)}`
      ).join("\n");
      download(header + rows, `queries-${domain}.csv`);
    } else {
      const header = "page,clicks,impressions,ctr,position,clicks_delta,impressions_delta,position_delta\n";
      const rows = filteredPages.map((r) =>
        `"${r.page}",${r.clicks},${r.impressions},${(r.ctr * 100).toFixed(2)}%,${r.position.toFixed(1)},${r.clicks_delta},${r.impressions_delta},${r.position_delta.toFixed(1)}`
      ).join("\n");
      download(header + rows, `pages-${domain}.csv`);
    }
  }

  function download(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const QuerySortHeader = ({ field, label, className }: { field: QuerySortField; label: string; className?: string }) => (
    <th
      className={cn("cursor-pointer pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-900 select-none", className)}
      onClick={() => handleQuerySort(field)}
    >
      {label} {querySortField === field ? (querySortDir === "desc" ? "↓" : "↑") : ""}
    </th>
  );

  const PageSortHeader = ({ field, label, className }: { field: PageSortField; label: string; className?: string }) => (
    <th
      className={cn("cursor-pointer pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-900 select-none", className)}
      onClick={() => handlePageSort(field)}
    >
      {label} {pageSortField === field ? (pageSortDir === "desc" ? "↓" : "↑") : ""}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total Clicks"
          value={formatNumber(totalClicks)}
          description="Last 28 days"
          icon={<MousePointerClick className="h-4 w-4" />}
          trend={totalClicksDelta !== 0 && totalClicks > 0 ? Math.round((totalClicksDelta / Math.max(totalClicks - totalClicksDelta, 1)) * 100) : undefined}
        />
        <KpiCard
          title="Total Impressions"
          value={formatNumber(totalImpressions)}
          description="Last 28 days"
          icon={<Eye className="h-4 w-4" />}
          trend={totalImpressionsDelta !== 0 && totalImpressions > 0 ? Math.round((totalImpressionsDelta / Math.max(totalImpressions - totalImpressionsDelta, 1)) * 100) : undefined}
        />
        <KpiCard
          title="Avg CTR"
          value={(avgCtr * 100).toFixed(2) + "%"}
          description="Last 28 days"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KpiCard
          title="Avg Position"
          value={avgPosition.toFixed(1)}
          description="Last 28 days"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          title="Indexed Pages"
          value={`${pagesWithClicks} / ${totalPages}`}
          description="Pages with clicks"
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      {/* Alerts */}
      {significantDrops.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-700">
              {significantDrops.length} query{significantDrops.length > 1 ? "s" : ""} dropped significantly
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {significantDrops.slice(0, 5).map((r) => `"${r.query}" (${r.position_delta.toFixed(1)})`).join(", ")}
              {significantDrops.length > 5 && ` +${significantDrops.length - 5} more`}
            </p>
          </div>
        </div>
      )}
      {significantGains.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-700">
              {significantGains.length} query{significantGains.length > 1 ? "s" : ""} improved significantly
            </p>
            <p className="mt-0.5 text-sm text-green-600">
              {significantGains.slice(0, 5).map((r) => `"${r.query}" (+${r.position_delta.toFixed(1)})`).join(", ")}
              {significantGains.length > 5 && ` +${significantGains.length - 5} more`}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Clicks & Impressions Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area yAxisId="right" type="monotone" dataKey="impressions" stroke="#93c5fd" fill="#dbeafe" name="Impressions" />
                  <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Avg Position & CTR Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" reversed tick={{ fontSize: 11 }} label={{ value: "Position", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: "CTR %", angle: 90, position: "insideRight", style: { fontSize: 11 } }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="position" stroke="#f59e0b" fill="#fef3c7" name="Avg Position" />
                  <Area yAxisId="right" type="monotone" dataKey="ctr" stroke="#10b981" fill="#d1fae5" name="CTR %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Position Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Position Distribution ({rankings.length} queries)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={positionBuckets} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" name="Queries" radius={[0, 4, 4, 0]}>
                {positionBuckets.map((entry) => (
                  <rect key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3">
            {positionBuckets.map((b) => (
              <div key={b.name} className="flex items-center gap-1.5 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.fill }} />
                <span className="text-gray-600">{b.name}: <span className="font-semibold">{b.count}</span></span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Data Tables */}
      <Tabs defaultValue="queries">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="queries" className="gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Queries ({rankings.length})
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Pages ({pages.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Queries Tab */}
        <TabsContent value="queries" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Search Queries</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportCsv("queries")}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search queries..." value={querySearch} onChange={(e) => setQuerySearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <QuerySortHeader field="query" label="Query" />
                      <QuerySortHeader field="clicks" label="Clicks" />
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                      <QuerySortHeader field="impressions" label="Impressions" />
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                      <QuerySortHeader field="ctr" label="CTR" />
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                      <QuerySortHeader field="position" label="Position" />
                      <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredQueries.map((r) => (
                      <tr key={r.query} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium max-w-xs truncate" title={r.query}>{r.query}</td>
                        <td className="py-3 pr-4 tabular-nums">{formatNumber(r.clicks)}</td>
                        <td className="py-3 pr-4"><DeltaCell value={r.clicks_delta} /></td>
                        <td className="py-3 pr-4 tabular-nums">{formatNumber(r.impressions)}</td>
                        <td className="py-3 pr-4"><DeltaCell value={r.impressions_delta} /></td>
                        <td className="py-3 pr-4 tabular-nums">{(r.ctr * 100).toFixed(2)}%</td>
                        <td className="py-3 pr-4"><DeltaCell value={r.ctr_delta} /></td>
                        <td className="py-3 pr-4"><PositionBadge position={r.position} /></td>
                        <td className="py-3"><DeltaCell value={r.position_delta} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredQueries.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">No queries match your search.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pages</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportCsv("pages")}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search pages..." value={pageSearch} onChange={(e) => setPageSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <PageSortHeader field="page" label="Page URL" />
                      <PageSortHeader field="clicks" label="Clicks" />
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                      <PageSortHeader field="impressions" label="Impressions" />
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                      <PageSortHeader field="ctr" label="CTR" />
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                      <PageSortHeader field="position" label="Avg Position" />
                      <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPages.map((r) => {
                      const shortUrl = r.page.replace(/^https?:\/\/[^/]+/, "");
                      return (
                        <tr key={r.page} className="hover:bg-gray-50">
                          <td className="py-3 pr-4 max-w-md">
                            <div className="flex items-center gap-2">
                              <a
                                href={r.page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate font-medium"
                                title={r.page}
                              >
                                {shortUrl || "/"}
                              </a>
                              {r.clicks === 0 && r.impressions > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 shrink-0">
                                  0 clicks
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4 tabular-nums">{formatNumber(r.clicks)}</td>
                          <td className="py-3 pr-4"><DeltaCell value={r.clicks_delta} /></td>
                          <td className="py-3 pr-4 tabular-nums">{formatNumber(r.impressions)}</td>
                          <td className="py-3 pr-4"><DeltaCell value={r.impressions_delta} /></td>
                          <td className="py-3 pr-4 tabular-nums">{(r.ctr * 100).toFixed(2)}%</td>
                          <td className="py-3 pr-4"><DeltaCell value={r.ctr_delta} /></td>
                          <td className="py-3 pr-4"><PositionBadge position={r.position} /></td>
                          <td className="py-3"><DeltaCell value={r.position_delta} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredPages.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">No pages match your search.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
