"use client";

<<<<<<< HEAD
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
=======
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle, ArrowUpRight, ArrowDownRight, Minus,
  Search, Download, RefreshCw, Globe, Monitor, Smartphone, Tablet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";
import type { GscFullData, GscRow } from "@/lib/integrations/gsc";

interface RankingsViewProps {
  gscData: GscFullData;
  prevGscData: GscFullData | null;
>>>>>>> refs/remotes/origin/main
  siteId: string;
  domain: string;
  siteUrl: string;
  allSites: Array<{ id: string; domain: string; gsc_property_url: string | null }>;
  rangeDays: number;
}

<<<<<<< HEAD
type QuerySortField = "query" | "clicks" | "impressions" | "ctr" | "position";
type PageSortField = "page" | "clicks" | "impressions" | "ctr" | "position";

function DeltaCell({ value, inverted }: { value: number; inverted?: boolean }) {
  const isGood = inverted ? value < 0 : value > 0;
  const isBad = inverted ? value > 0 : value < 0;
=======
function fmt(n: number | null | undefined, decimals = 0) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(decimals);
}

function pct(n: number | null | undefined) {
  if (n == null) return "—";
  return (n * 100).toFixed(2) + "%";
}
>>>>>>> refs/remotes/origin/main

function pos(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toFixed(1);
}

function posBadge(p: number) {
  if (p <= 3) return "bg-green-100 text-green-800";
  if (p <= 10) return "bg-blue-100 text-blue-800";
  if (p <= 20) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-600";
}

function Delta({ curr, prev, invert = false, isPercent = false }: {
  curr: number; prev: number; invert?: boolean; isPercent?: boolean;
}) {
  const diff = curr - prev;
  if (Math.abs(diff) < 0.0001) return <span className="text-gray-300 text-xs">—</span>;
  const good = invert ? diff < 0 : diff > 0;
  const label = isPercent
    ? (diff * 100).toFixed(2) + "pp"
    : Math.abs(diff) >= 1 ? fmt(Math.abs(diff)) : (Math.abs(diff) * 100).toFixed(1) + "%";

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", good ? "text-green-600" : "text-red-500")}>
      {good ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {label}
    </span>
  );
}

<<<<<<< HEAD
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
=======
function buildPrevMap(rows: GscRow[], keyCount: number) {
  const m = new Map<string, GscRow>();
  for (const r of rows) {
    const key = (r.keys ?? []).slice(0, keyCount).join("|||");
    m.set(key, r);
  }
  return m;
}

type SortDir = "asc" | "desc";

function useSortableTable<T>(rows: T[], defaultField: keyof T) {
  const [field, setField] = useState<keyof T>(defaultField);
  const [dir, setDir] = useState<SortDir>("desc");

  function toggleSort(f: keyof T) {
    if (f === field) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setField(f); setDir("desc"); }
  }

  const sorted = [...rows].sort((a, b) => {
    const va = a[field]; const vb = b[field];
    if (typeof va === "string" && typeof vb === "string")
      return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    const na = (va as number) ?? 0; const nb = (vb as number) ?? 0;
    return dir === "asc" ? na - nb : nb - na;
  });

  function Th({ f, label, className }: { f: keyof T; label: string; className?: string }) {
>>>>>>> refs/remotes/origin/main
    return (
      <th
        className={cn("cursor-pointer select-none whitespace-nowrap pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-900", className)}
        onClick={() => toggleSort(f)}
      >
        {label} {field === f ? (dir === "desc" ? "↓" : "↑") : <span className="text-gray-300">↕</span>}
      </th>
    );
  }

  return { sorted, toggleSort, Th, field, dir };
}

export function RankingsView({
  gscData, prevGscData, siteId, domain, siteUrl, allSites, rangeDays,
}: RankingsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [querySearch, setQuerySearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ── Aggregate KPIs ──────────────────────────────────────────────
  const totClicks = gscData.queries.reduce((s, r) => s + (r.clicks ?? 0), 0);
  const totImpressions = gscData.queries.reduce((s, r) => s + (r.impressions ?? 0), 0);
  const avgCtr = totImpressions > 0 ? totClicks / totImpressions : 0;
  const avgPos = gscData.queries.length > 0
    ? gscData.queries.reduce((s, r) => s + (r.position ?? 0) * (r.impressions ?? 0), 0) / Math.max(totImpressions, 1)
    : 0;

  const prevTotClicks = prevGscData?.queries.reduce((s, r) => s + (r.clicks ?? 0), 0) ?? 0;
  const prevTotImpressions = prevGscData?.queries.reduce((s, r) => s + (r.impressions ?? 0), 0) ?? 0;
  const prevAvgCtr = prevTotImpressions > 0 ? prevTotClicks / prevTotImpressions : 0;
  const prevAvgPos = prevGscData && prevGscData.queries.length > 0
    ? prevGscData.queries.reduce((s, r) => s + (r.position ?? 0) * (r.impressions ?? 0), 0) / Math.max(prevTotImpressions, 1)
    : 0;

  // ── Queries table ───────────────────────────────────────────────
  const prevQueryMap = buildPrevMap(prevGscData?.queries ?? [], 1);

  interface QueryRow {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    prevClicks: number;
    prevImpressions: number;
    prevCtr: number;
    prevPosition: number;
  }

  const queryRows: QueryRow[] = gscData.queries
    .filter((r) => (r.keys?.[0] ?? "").toLowerCase().includes(querySearch.toLowerCase()))
    .map((r) => {
      const prev = prevQueryMap.get(r.keys?.[0] ?? "");
      return {
        query: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
        prevClicks: prev?.clicks ?? 0,
        prevImpressions: prev?.impressions ?? 0,
        prevCtr: prev?.ctr ?? 0,
        prevPosition: prev?.position ?? 0,
      };
    });

  const qTable = useSortableTable(queryRows, "impressions");

  // Position buckets
  const top3 = queryRows.filter((r) => r.position <= 3).length;
  const top10 = queryRows.filter((r) => r.position > 3 && r.position <= 10).length;
  const pos11_20 = queryRows.filter((r) => r.position > 10 && r.position <= 20).length;
  const pos21plus = queryRows.filter((r) => r.position > 20).length;

  // ── Pages table ─────────────────────────────────────────────────
  const prevPageMap = buildPrevMap(prevGscData?.pages ?? [], 1);

  interface PageRow {
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    prevClicks: number;
    prevImpressions: number;
    prevCtr: number;
    prevPosition: number;
  }

  const pageRows: PageRow[] = gscData.pages
    .filter((r) => (r.keys?.[0] ?? "").toLowerCase().includes(pageSearch.toLowerCase()))
    .map((r) => {
      const prev = prevPageMap.get(r.keys?.[0] ?? "");
      return {
        page: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
        prevClicks: prev?.clicks ?? 0,
        prevImpressions: prev?.impressions ?? 0,
        prevCtr: prev?.ctr ?? 0,
        prevPosition: prev?.position ?? 0,
      };
    });

  const pTable = useSortableTable(pageRows, "clicks");

  // ── Dropped queries ─────────────────────────────────────────────
  const droppedQueries = queryRows
    .filter((r) => r.prevPosition > 0 && r.position - r.prevPosition > 3)
    .sort((a, b) => (b.position - b.prevPosition) - (a.position - a.prevPosition))
    .slice(0, 20);

  // Low CTR opportunities (pos 1-10, CTR < 2%)
  const lowCtrOpp = queryRows
    .filter((r) => r.position <= 10 && r.ctr < 0.02 && r.impressions > 50)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  // ── Device breakdown ────────────────────────────────────────────
  const deviceData = gscData.devices.map((r) => ({
    device: r.keys?.[0] ?? "unknown",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));

  // ── Country breakdown ───────────────────────────────────────────
  const countryData = gscData.countries.map((r) => ({
    country: (r.keys?.[0] ?? "unknown").toUpperCase(),
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  })).sort((a, b) => b.clicks - a.clicks);

  const cTable = useSortableTable(countryData, "clicks");

  // ── Date trend ──────────────────────────────────────────────────
  const trendData = gscData.dateTrend.map((r) => ({
    date: r.keys?.[0]?.slice(5) ?? "", // MM-DD
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: Number(((r.ctr ?? 0) * 100).toFixed(2)),
    position: Number((r.position ?? 0).toFixed(1)),
  }));

  // ── Exports ─────────────────────────────────────────────────────
  function exportCsv(type: "queries" | "pages" | "countries") {
    let header = "";
    let rows: string[] = [];

    if (type === "queries") {
      header = "query,clicks,impressions,ctr,avg_position\n";
      rows = qTable.sorted.map((r) =>
        `"${r.query}",${r.clicks},${r.impressions},${pct(r.ctr)},${pos(r.position)}`);
    } else if (type === "pages") {
      header = "page,clicks,impressions,ctr,avg_position\n";
      rows = pTable.sorted.map((r) =>
        `"${r.page}",${r.clicks},${r.impressions},${pct(r.ctr)},${pos(r.position)}`);
    } else {
      header = "country,clicks,impressions,ctr,avg_position\n";
      rows = cTable.sorted.map((r) =>
        `"${r.country}",${r.clicks},${r.impressions},${pct(r.ctr)},${pos(r.position)}`);
    }

    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${domain}-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function changeRange(days: number) {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("range", String(days));
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1500);
  }

  const deviceIcon = (d: string) => {
    if (d === "MOBILE") return <Smartphone className="h-4 w-4" />;
    if (d === "TABLET") return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
<<<<<<< HEAD
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
=======
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{siteUrl}</span>
          {allSites.length > 1 && (
            <select
              className="ml-2 rounded-md border border-gray-200 px-2 py-1 text-xs"
              defaultValue={siteId}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams?.toString());
                params.set("site", e.target.value);
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              {allSites.map((s) => (
                <option key={s.id} value={s.id}>{s.domain}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {[7, 28, 90].map((d) => (
            <Button
              key={d}
              variant={rangeDays === d ? "default" : "outline"}
              size="sm"
              onClick={() => changeRange(d)}
            >
              {d}d
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Clicks", curr: totClicks, prev: prevTotClicks, fmt: fmt },
          { label: "Total Impressions", curr: totImpressions, prev: prevTotImpressions, fmt: fmt },
          { label: "Avg CTR", curr: avgCtr, prev: prevAvgCtr, fmt: pct },
          { label: "Avg Position", curr: avgPos, prev: prevAvgPos, fmt: pos, invert: true },
        ].map(({ label, curr, prev, fmt: f, invert }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{f(curr)}</p>
              {prev > 0 && (
                <div className="mt-1">
                  <Delta curr={curr} prev={prev} invert={invert} />
                  <span className="ml-1 text-xs text-gray-400">vs prev period</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Position distribution */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Top 3", count: top3, color: "bg-green-100 text-green-800 border-green-200" },
          { label: "Top 4–10", count: top10, color: "bg-blue-100 text-blue-800 border-blue-200" },
          { label: "Pos 11–20", count: pos11_20, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
          { label: "Pos 21+", count: pos21plus, color: "bg-gray-100 text-gray-600 border-gray-200" },
        ].map(({ label, count, color }) => (
          <Card key={label} className={cn("border", color)}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-1">{label}</p>
              <p className="text-xs opacity-70">{queryRows.length > 0 ? Math.round((count / queryRows.length) * 100) : 0}% of queries</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {droppedQueries.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <p className="font-semibold text-orange-800">{droppedQueries.length} queries dropped in position</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {droppedQueries.slice(0, 6).map((r) => (
              <Badge key={r.query} variant="outline" className="border-orange-300 text-orange-700 text-xs">
                {r.query.slice(0, 40)} (+{(r.position - r.prevPosition).toFixed(1)})
              </Badge>
            ))}
            {droppedQueries.length > 6 && <Badge variant="outline" className="text-xs">+{droppedQueries.length - 6} more</Badge>}
>>>>>>> refs/remotes/origin/main
          </div>
        </div>
      )}

<<<<<<< HEAD
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
=======
      {lowCtrOpp.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-5 w-5 text-blue-600" />
            <p className="font-semibold text-blue-800">{lowCtrOpp.length} CTR opportunities — ranked top 10 but CTR &lt; 2%</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowCtrOpp.slice(0, 6).map((r) => (
              <Badge key={r.query} variant="outline" className="border-blue-300 text-blue-700 text-xs">
                {r.query.slice(0, 40)} (pos {r.position.toFixed(1)}, {pct(r.ctr)} CTR)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Trend chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Trend</CardTitle>
            <CardDescription>Clicks & impressions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} dot={false} name="Clicks" />
                <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#93c5fd" strokeWidth={1.5} dot={false} name="Impressions" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Queries / Pages / Devices / Countries */}
      <Tabs defaultValue="queries">
        <TabsList className="mb-4">
          <TabsTrigger value="queries">Queries ({queryRows.length})</TabsTrigger>
          <TabsTrigger value="pages">Pages ({pageRows.length})</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
        </TabsList>

        {/* QUERIES */}
        <TabsContent value="queries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Search Queries</CardTitle>
                <CardDescription>All keywords driving traffic from Google</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => exportCsv("queries")}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter queries..."
                  value={querySearch}
                  onChange={(e) => setQuerySearch(e.target.value)}
                  className="pl-9"
                />
>>>>>>> refs/remotes/origin/main
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
<<<<<<< HEAD
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
=======
                      <qTable.Th f="query" label="Query" className="min-w-[200px]" />
                      <qTable.Th f="clicks" label="Clicks" />
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">vs prev</th>
                      <qTable.Th f="impressions" label="Impressions" />
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">vs prev</th>
                      <qTable.Th f="ctr" label="CTR" />
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">vs prev</th>
                      <qTable.Th f="position" label="Avg Position" />
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">vs prev</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {qTable.sorted.map((r) => (
                      <tr key={r.query} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-medium max-w-xs truncate" title={r.query}>{r.query}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-2.5 pr-4">
                          {r.prevClicks > 0 && <Delta curr={r.clicks} prev={r.prevClicks} />}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-2.5 pr-4">
                          {r.prevImpressions > 0 && <Delta curr={r.impressions} prev={r.prevImpressions} />}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{pct(r.ctr)}</td>
                        <td className="py-2.5 pr-4">
                          {r.prevCtr > 0 && <Delta curr={r.ctr} prev={r.prevCtr} isPercent />}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", posBadge(r.position))}>
                            {pos(r.position)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          {r.prevPosition > 0 && <Delta curr={r.position} prev={r.prevPosition} invert />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {qTable.sorted.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-400">No queries match your filter.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAGES */}
        <TabsContent value="pages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Pages</CardTitle>
                <CardDescription>Which pages are indexed and receiving impressions/clicks</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => exportCsv("pages")}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter pages..."
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <pTable.Th f="page" label="Page URL" className="min-w-[240px]" />
                      <pTable.Th f="clicks" label="Clicks" />
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">vs prev</th>
                      <pTable.Th f="impressions" label="Impressions" />
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">vs prev</th>
                      <pTable.Th f="ctr" label="CTR" />
                      <pTable.Th f="position" label="Avg Position" />
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Indexed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pTable.sorted.map((r) => (
                      <tr key={r.page} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-mono text-xs max-w-sm truncate text-blue-700" title={r.page}>
                          <a href={r.page} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {r.page.replace(/^https?:\/\/[^/]+/, "") || "/"}
                          </a>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-2.5 pr-4">
                          {r.prevClicks > 0 && <Delta curr={r.clicks} prev={r.prevClicks} />}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-2.5 pr-4">
                          {r.prevImpressions > 0 && <Delta curr={r.impressions} prev={r.prevImpressions} />}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{pct(r.ctr)}</td>
                        <td className="py-2.5 pr-4">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", posBadge(r.position))}>
                            {pos(r.position)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          {r.impressions > 0
                            ? <Badge variant="outline" className="border-green-300 text-green-700 text-xs">Indexed</Badge>
                            : <Badge variant="outline" className="text-xs text-gray-400">Unknown</Badge>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pTable.sorted.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-400">No pages match your filter.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEVICES */}
        <TabsContent value="devices">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Breakdown</CardTitle>
                <CardDescription>Clicks and impressions by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceData.map((d) => {
                    const sharePct = totClicks > 0 ? (d.clicks / totClicks) * 100 : 0;
                    return (
                      <div key={d.device}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {deviceIcon(d.device)}
                            <span className="text-sm font-medium capitalize">{d.device.toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>{fmt(d.clicks)} clicks</span>
                            <span className="text-gray-400">{fmt(d.impressions)} impr.</span>
                            <span className="text-gray-400">{pct(d.ctr)} CTR</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", posBadge(d.position))}>
                              pos {pos(d.position)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${sharePct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{sharePct.toFixed(1)}% of total clicks</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Clicks Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deviceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="device" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="impressions" fill="#bfdbfe" name="Impressions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* COUNTRIES */}
        <TabsContent value="countries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Country Breakdown</CardTitle>
                <CardDescription>Top 50 countries by clicks</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => exportCsv("countries")}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <cTable.Th f="country" label="Country" />
                      <cTable.Th f="clicks" label="Clicks" />
                      <cTable.Th f="impressions" label="Impressions" />
                      <cTable.Th f="ctr" label="CTR" />
                      <cTable.Th f="position" label="Avg Position" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cTable.sorted.map((r) => (
                      <tr key={r.country} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-medium">{r.country}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{pct(r.ctr)}</td>
                        <td className="py-2.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", posBadge(r.position))}>
                            {pos(r.position)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
>>>>>>> refs/remotes/origin/main
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
