"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle, ArrowUpRight, ArrowDownRight,
  Search, Download, RefreshCw, Globe, Monitor, Smartphone, Tablet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import type { GscFullData, GscRow } from "@/lib/integrations/gsc";

interface RankingsViewProps {
  gscData: GscFullData;
  prevGscData: GscFullData | null;
  siteId: string;
  domain: string;
  siteUrl: string;
  allSites: Array<{ id: string; domain: string; gsc_property_url: string | null }>;
  rangeDays: number;
}

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

function pos(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toFixed(1);
}

function posBadge(p: number) {
  if (p <= 3) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (p <= 10) return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
  if (p <= 20) return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
  return "bg-white/[0.06] text-white/40";
}

function Delta({ curr, prev, invert = false, isPercent = false }: {
  curr: number; prev: number; invert?: boolean; isPercent?: boolean;
}) {
  const diff = curr - prev;
  if (Math.abs(diff) < 0.0001) return <span className="text-white/20 text-xs">—</span>;
  const good = invert ? diff < 0 : diff > 0;
  const label = isPercent
    ? (diff * 100).toFixed(2) + "pp"
    : Math.abs(diff) >= 1 ? fmt(Math.abs(diff)) : (Math.abs(diff) * 100).toFixed(1) + "%";

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", good ? "text-emerald-400" : "text-red-400")}>
      {good ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {label}
    </span>
  );
}

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
    return (
      <th
        className={cn("cursor-pointer select-none whitespace-nowrap pb-3 pr-4 text-left text-[10px] uppercase tracking-widest text-white/25 hover:text-white/50", className)}
        onClick={() => toggleSort(f)}
      >
        {label} {field === f ? (dir === "desc" ? "↓" : "↑") : <span className="text-white/15">↕</span>}
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
    query: string; clicks: number; impressions: number; ctr: number; position: number;
    prevClicks: number; prevImpressions: number; prevCtr: number; prevPosition: number;
  }

  const queryRows: QueryRow[] = gscData.queries
    .filter((r) => (r.keys?.[0] ?? "").toLowerCase().includes(querySearch.toLowerCase()))
    .map((r) => {
      const prev = prevQueryMap.get(r.keys?.[0] ?? "");
      return {
        query: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0, impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0, position: r.position ?? 0,
        prevClicks: prev?.clicks ?? 0, prevImpressions: prev?.impressions ?? 0,
        prevCtr: prev?.ctr ?? 0, prevPosition: prev?.position ?? 0,
      };
    });

  const qTable = useSortableTable(queryRows, "impressions");

  const top3 = queryRows.filter((r) => r.position <= 3).length;
  const top10 = queryRows.filter((r) => r.position > 3 && r.position <= 10).length;
  const pos11_20 = queryRows.filter((r) => r.position > 10 && r.position <= 20).length;
  const pos21plus = queryRows.filter((r) => r.position > 20).length;

  // ── Pages table ─────────────────────────────────────────────────
  const prevPageMap = buildPrevMap(prevGscData?.pages ?? [], 1);

  interface PageRowT {
    page: string; clicks: number; impressions: number; ctr: number; position: number;
    prevClicks: number; prevImpressions: number; prevCtr: number; prevPosition: number;
  }

  const pageRows: PageRowT[] = gscData.pages
    .filter((r) => (r.keys?.[0] ?? "").toLowerCase().includes(pageSearch.toLowerCase()))
    .map((r) => {
      const prev = prevPageMap.get(r.keys?.[0] ?? "");
      return {
        page: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0, impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0, position: r.position ?? 0,
        prevClicks: prev?.clicks ?? 0, prevImpressions: prev?.impressions ?? 0,
        prevCtr: prev?.ctr ?? 0, prevPosition: prev?.position ?? 0,
      };
    });

  const pTable = useSortableTable(pageRows, "clicks");

  // ── Dropped queries & low CTR opps ──────────────────────────────
  const droppedQueries = queryRows
    .filter((r) => r.prevPosition > 0 && r.position - r.prevPosition > 3)
    .sort((a, b) => (b.position - b.prevPosition) - (a.position - a.prevPosition))
    .slice(0, 20);

  const lowCtrOpp = queryRows
    .filter((r) => r.position <= 10 && r.ctr < 0.02 && r.impressions > 50)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  // ── Device breakdown ────────────────────────────────────────────
  const deviceData = gscData.devices.map((r) => ({
    device: r.keys?.[0] ?? "unknown",
    clicks: r.clicks ?? 0, impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0, position: r.position ?? 0,
  }));

  // ── Country breakdown ───────────────────────────────────────────
  const countryData = gscData.countries.map((r) => ({
    country: (r.keys?.[0] ?? "unknown").toUpperCase(),
    clicks: r.clicks ?? 0, impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0, position: r.position ?? 0,
  })).sort((a, b) => b.clicks - a.clicks);

  const cTable = useSortableTable(countryData, "clicks");

  // ── Query × Page pairs ──────────────────────────────────────────
  const queryPageRows = gscData.queryPages.map((r) => ({
    query: r.keys?.[0] ?? "",
    page: r.keys?.[1] ?? "",
    clicks: r.clicks ?? 0, impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0, position: r.position ?? 0,
  })).sort((a, b) => b.impressions - a.impressions);

  const qpTable = useSortableTable(queryPageRows, "impressions");

  // ── Date trend ──────────────────────────────────────────────────
  const trendData = gscData.dateTrend.map((r) => ({
    date: r.keys?.[0]?.slice(5) ?? "",
    clicks: r.clicks ?? 0, impressions: r.impressions ?? 0,
    ctr: Number(((r.ctr ?? 0) * 100).toFixed(2)),
    position: Number((r.position ?? 0).toFixed(1)),
  }));

  // ── Exports ─────────────────────────────────────────────────────
  function exportCsv(type: "queries" | "pages" | "countries") {
    let header = "";
    let rows: string[] = [];
    if (type === "queries") {
      header = "query,clicks,impressions,ctr,avg_position\n";
      rows = qTable.sorted.map((r) => `"${r.query}",${r.clicks},${r.impressions},${pct(r.ctr)},${pos(r.position)}`);
    } else if (type === "pages") {
      header = "page,clicks,impressions,ctr,avg_position\n";
      rows = pTable.sorted.map((r) => `"${r.page}",${r.clicks},${r.impressions},${pct(r.ctr)},${pos(r.position)}`);
    } else {
      header = "country,clicks,impressions,ctr,avg_position\n";
      rows = cTable.sorted.map((r) => `"${r.country}",${r.clicks},${r.impressions},${pct(r.ctr)},${pos(r.position)}`);
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
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-white/30" strokeWidth={1.5} />
          <span className="text-xs text-white/50">{siteUrl}</span>
          {allSites.length > 1 && (
            <select
              className="ml-2 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/60"
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
            <Button key={d} variant={rangeDays === d ? "default" : "outline"} size="sm" onClick={() => changeRange(d)}>
              {d}d
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} strokeWidth={1.5} />
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
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">{label}</p>
              <p className="mt-2 text-3xl font-light text-white">{f(curr)}</p>
              {prev > 0 && (
                <div className="mt-1.5">
                  <Delta curr={curr} prev={prev} invert={invert} />
                  <span className="ml-1 text-xs text-white/25">vs prev period</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Position distribution */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Top 3", count: top3, color: "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400" },
          { label: "Top 4–10", count: top10, color: "border-blue-500/20 bg-blue-500/[0.06] text-blue-400" },
          { label: "Pos 11–20", count: pos11_20, color: "border-yellow-500/20 bg-yellow-500/[0.06] text-yellow-400" },
          { label: "Pos 21+", count: pos21plus, color: "border-white/[0.06] bg-white/[0.02] text-white/40" },
        ].map(({ label, count, color }) => (
          <div key={label} className={cn("rounded-lg border p-4 text-center", color)}>
            <p className="text-2xl font-light">{count}</p>
            <p className="text-[10px] font-medium mt-1 uppercase tracking-widest opacity-70">{label}</p>
            <p className="text-xs opacity-50 mt-0.5">{queryRows.length > 0 ? Math.round((count / queryRows.length) * 100) : 0}%</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {droppedQueries.length > 0 && (
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.06] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
            <p className="text-xs font-medium text-orange-400">{droppedQueries.length} queries dropped in position</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {droppedQueries.slice(0, 6).map((r) => (
              <Badge key={r.query} variant="outline" className="border-orange-500/30 text-orange-400 text-[10px]">
                {r.query.slice(0, 40)} (+{(r.position - r.prevPosition).toFixed(1)})
              </Badge>
            ))}
            {droppedQueries.length > 6 && <Badge variant="outline" className="text-[10px]">+{droppedQueries.length - 6} more</Badge>}
          </div>
        </div>
      )}

      {lowCtrOpp.length > 0 && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.06] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
            <p className="text-xs font-medium text-blue-400">{lowCtrOpp.length} CTR opportunities — ranked top 10 but CTR &lt; 2%</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowCtrOpp.slice(0, 6).map((r) => (
              <Badge key={r.query} variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">
                {r.query.slice(0, 40)} (pos {r.position.toFixed(1)}, {pct(r.ctr)} CTR)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Trend chart */}
      {trendData.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-xs font-medium text-white/60 uppercase tracking-widest">Performance Trend</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "11px" }} itemStyle={{ color: "rgba(255,255,255,0.6)" }} labelStyle={{ color: "rgba(255,255,255,0.4)" }} />
                <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} dot={false} name="Clicks" />
                <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} dot={false} name="Impressions" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Tabs: Queries / Pages / Query × Page / Devices / Countries */}
      <Tabs defaultValue="queries">
        <TabsList className="mb-4">
          <TabsTrigger value="queries">Queries ({queryRows.length})</TabsTrigger>
          <TabsTrigger value="pages">Pages ({pageRows.length})</TabsTrigger>
          <TabsTrigger value="queryPages">Query × Page ({queryPageRows.length})</TabsTrigger>
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
                <Download className="mr-1.5 h-3 w-3" strokeWidth={1.5} /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" strokeWidth={1.5} />
                <Input placeholder="Filter queries..." value={querySearch} onChange={(e) => setQuerySearch(e.target.value)} className="pl-9" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <qTable.Th f="query" label="Query" className="min-w-[200px]" />
                      <qTable.Th f="clicks" label="Clicks" />
                      <th className="pb-3 pr-4 text-left text-[10px] font-medium uppercase tracking-widest text-white/25">vs prev</th>
                      <qTable.Th f="impressions" label="Impressions" />
                      <th className="pb-3 pr-4 text-left text-[10px] font-medium uppercase tracking-widest text-white/25">vs prev</th>
                      <qTable.Th f="ctr" label="CTR" />
                      <th className="pb-3 pr-4 text-left text-[10px] font-medium uppercase tracking-widest text-white/25">vs prev</th>
                      <qTable.Th f="position" label="Avg Position" />
                      <th className="pb-3 text-left text-[10px] font-medium uppercase tracking-widest text-white/25">vs prev</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {qTable.sorted.map((r) => (
                      <tr key={r.query} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-4 font-medium max-w-xs truncate" title={r.query}>{r.query}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-2.5 pr-4">{r.prevClicks > 0 && <Delta curr={r.clicks} prev={r.prevClicks} />}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-2.5 pr-4">{r.prevImpressions > 0 && <Delta curr={r.impressions} prev={r.prevImpressions} />}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{pct(r.ctr)}</td>
                        <td className="py-2.5 pr-4">{r.prevCtr > 0 && <Delta curr={r.ctr} prev={r.prevCtr} isPercent />}</td>
                        <td className="py-2.5 pr-4">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", posBadge(r.position))}>{pos(r.position)}</span>
                        </td>
                        <td className="py-2.5">{r.prevPosition > 0 && <Delta curr={r.position} prev={r.prevPosition} invert />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {qTable.sorted.length === 0 && <p className="py-8 text-center text-xs text-white/20">No queries match your filter.</p>}
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
                <Download className="mr-1.5 h-3 w-3" strokeWidth={1.5} /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" strokeWidth={1.5} />
                <Input placeholder="Filter pages..." value={pageSearch} onChange={(e) => setPageSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <pTable.Th f="page" label="Page URL" className="min-w-[240px]" />
                      <pTable.Th f="clicks" label="Clicks" />
                      <th className="pb-3 pr-4 text-left text-[10px] font-medium uppercase tracking-widest text-white/25">vs prev</th>
                      <pTable.Th f="impressions" label="Impressions" />
                      <th className="pb-3 pr-4 text-left text-[10px] font-medium uppercase tracking-widest text-white/25">vs prev</th>
                      <pTable.Th f="ctr" label="CTR" />
                      <pTable.Th f="position" label="Avg Position" />
                      <th className="pb-3 text-left text-[10px] font-medium uppercase tracking-widest text-white/25">Indexed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pTable.sorted.map((r) => (
                      <tr key={r.page} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-4 font-mono text-xs max-w-sm truncate text-blue-400" title={r.page}>
                          <a href={r.page} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {r.page.replace(/^https?:\/\/[^/]+/, "") || "/"}
                          </a>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-2.5 pr-4">{r.prevClicks > 0 && <Delta curr={r.clicks} prev={r.prevClicks} />}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-2.5 pr-4">
                          {r.prevImpressions > 0 && <Delta curr={r.impressions} prev={r.prevImpressions} />}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{pct(r.ctr)}</td>
                        <td className="py-2.5 pr-4">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", posBadge(r.position))}>{pos(r.position)}</span>
                        </td>
                        <td className="py-2.5">
                          {r.impressions > 0
                            ? <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">Indexed</Badge>
                            : <Badge variant="outline" className="text-xs text-white/30">Unknown</Badge>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pTable.sorted.length === 0 && <p className="py-8 text-center text-xs text-white/20">No pages match your filter.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUERY × PAGE */}
        <TabsContent value="queryPages">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Query × Page Pairs</CardTitle>
              <CardDescription>Every query + landing page combination reported by GSC</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <qpTable.Th f="query" label="Query" className="min-w-[160px]" />
                      <qpTable.Th f="page" label="Page" className="min-w-[220px]" />
                      <qpTable.Th f="clicks" label="Clicks" />
                      <qpTable.Th f="impressions" label="Impressions" />
                      <qpTable.Th f="ctr" label="CTR" />
                      <qpTable.Th f="position" label="Avg Pos" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {qpTable.sorted.map((r, i) => (
                      <tr key={`${r.query}-${r.page}-${i}`} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-4 max-w-xs truncate text-white/70" title={r.query}>{r.query}</td>
                        <td className="py-2.5 pr-4 font-mono text-xs max-w-sm truncate text-blue-400" title={r.page}>
                          <a href={r.page} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {r.page.replace(/^https?:\/\/[^/]+/, "") || "/"}
                          </a>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{pct(r.ctr)}</td>
                        <td className="py-2.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", posBadge(r.position))}>{pos(r.position)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {qpTable.sorted.length === 0 && <p className="py-8 text-center text-xs text-white/20">No query/page pairs available.</p>}
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
                            <span className="text-white/30">{fmt(d.impressions)} impr.</span>
                            <span className="text-white/30">{pct(d.ctr)} CTR</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", posBadge(d.position))}>pos {pos(d.position)}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.06]">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(sharePct, 100)}%` }} />
                        </div>
                        <p className="text-xs text-white/30 mt-0.5">{sharePct.toFixed(1)}% of total clicks</p>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="device" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "11px" }} />
                    <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="impressions" fill="rgba(59,130,246,0.3)" name="Impressions" radius={[4, 4, 0, 0]} />
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
                <Download className="mr-1.5 h-3 w-3" strokeWidth={1.5} /> Export CSV
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
                      <tr key={r.country} className="hover:bg-white/[0.02]">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
