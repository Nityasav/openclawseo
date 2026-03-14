"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingDown, TrendingUp, Minus, Download, Search, Sparkles, Loader2 } from "lucide-react";
import { cn, formatNumber, getPositionBadgeColor, getOpportunityColor } from "@/lib/utils";

interface Keyword {
  id: string;
  keyword: string;
  current_position: number | null;
  previous_position: number | null;
  search_volume: number | null;
  difficulty: number | null;
  opportunity_score: number | null;
  last_checked_at: string | null;
  source?: string | null;
}

export function KeywordsTable({ keywords, siteId, hasGa4 }: { keywords: Keyword[]; siteId?: string | null; hasGa4?: boolean }) {
  const router = useRouter();
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Keyword>("opportunity_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [positionFilter, setPositionFilter] = useState<"all" | "top10" | "11-20" | "21-50">("all");

  const filtered = keywords
    .filter((kw) => {
      const matchSearch = kw.keyword.toLowerCase().includes(search.toLowerCase());
      const pos = kw.current_position ?? 100;
      const matchPos =
        positionFilter === "all" ||
        (positionFilter === "top10" && pos <= 10) ||
        (positionFilter === "11-20" && pos > 10 && pos <= 20) ||
        (positionFilter === "21-50" && pos > 20 && pos <= 50);
      return matchSearch && matchPos;
    })
    .sort((a, b) => {
      const va = (a[sortField] as number) ?? 0;
      const vb = (b[sortField] as number) ?? 0;
      return sortDir === "desc" ? vb - va : va - vb;
    });

  function handleSort(field: keyof Keyword) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  function exportCsv() {
    const header = "keyword,position,prev_position,delta,search_volume,difficulty,opportunity_score\n";
    const rows = filtered.map((kw) => {
      const delta = (kw.previous_position ?? 0) - (kw.current_position ?? 0);
      return `"${kw.keyword}",${kw.current_position ?? ""},${kw.previous_position ?? ""},${delta},${kw.search_volume ?? ""},${kw.difficulty ?? ""},${kw.opportunity_score ?? ""}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seoclaw-keywords.csv";
    a.click();
  }

  async function handleDiscover() {
    setDiscovering(true);
    setDiscoverError(null);
    try {
      const res = await fetch("/api/v1/keywords/discover", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setDiscoverError(data.error ?? "Discovery failed");
      } else {
        router.refresh();
      }
    } catch {
      setDiscoverError("Failed to connect to server");
    } finally {
      setDiscovering(false);
    }
  }

  const SortHeader = ({ field, label }: { field: keyof Keyword; label: string }) => (
    <th
      className="cursor-pointer pb-3 pr-4 text-left text-[10px] uppercase tracking-widest text-white/25 hover:text-white/50"
      onClick={() => handleSort(field)}
    >
      {label} {sortField === field ? (sortDir === "desc" ? "↓" : "↑") : ""}
    </th>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-xs font-medium text-white/60 uppercase tracking-widest">Keywords ({filtered.length})</h3>
        <div className="flex gap-2">
          {siteId && (
            <Button variant="secondary" size="sm" onClick={handleDiscover} disabled={discovering}>
              {discovering ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1.5 h-3 w-3" strokeWidth={1.5} />}
              {discovering ? "Discovering..." : "Discover"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3 w-3" strokeWidth={1.5} />
            Export
          </Button>
        </div>
      </div>

      {discoverError && (
        <div className="mx-5 mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          {discoverError}
        </div>
      )}

      <div className="p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20" strokeWidth={1.5} />
            <Input
              placeholder="Search keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "top10", "11-20", "21-50"] as const).map((f) => (
              <Button
                key={f}
                variant={positionFilter === f ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPositionFilter(f)}
              >
                {f === "all" ? "All" : `Pos. ${f}`}
              </Button>
            ))}
          </div>
        </div>

        {keywords.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-white/20">No keywords tracked yet.</p>
            <p className="mt-1 text-xs text-white/15">
              {siteId
                ? 'Click "Discover" to find relevant keywords using AI.'
                : "Connect Google Analytics in Settings, then discover keywords."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <SortHeader field="keyword" label="Keyword" />
                  <SortHeader field="current_position" label="Position" />
                  <th className="pb-3 pr-4 text-left text-[10px] uppercase tracking-widest text-white/25">Change</th>
                  <SortHeader field="search_volume" label="Volume" />
                  <SortHeader field="difficulty" label="Difficulty" />
                  <SortHeader field="opportunity_score" label="Opportunity" />
                  <th className="pb-3 text-left text-[10px] uppercase tracking-widest text-white/25">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((kw) => {
                  const delta = (kw.previous_position ?? kw.current_position ?? 0) - (kw.current_position ?? 0);
                  return (
                    <tr key={kw.id} className="group hover:bg-white/[0.02]">
                      <td className="py-3 pr-4 text-xs font-medium text-white/80">{kw.keyword}</td>
                      <td className="py-3 pr-4">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", getPositionBadgeColor(kw.current_position ?? 100))}>
                          {kw.current_position ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("flex items-center gap-1 text-xs font-medium", delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-white/20")}>
                          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          {delta !== 0 ? Math.abs(delta) : "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-white/40">{kw.search_volume ? formatNumber(kw.search_volume) : "—"}</td>
                      <td className="py-3 pr-4">
                        {kw.difficulty != null ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-16 rounded-full bg-white/[0.06]">
                              <div
                                className={cn("h-full rounded-full", kw.difficulty > 70 ? "bg-red-400" : kw.difficulty > 40 ? "bg-yellow-400" : "bg-emerald-400")}
                                style={{ width: `${kw.difficulty}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/30">{Math.round(kw.difficulty)}</span>
                          </div>
                        ) : <span className="text-xs text-white/20">—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("text-xs font-medium", getOpportunityColor(kw.opportunity_score ?? 0))}>
                          {kw.opportunity_score != null ? Math.round(kw.opportunity_score) : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/ai-blogs?primary=${encodeURIComponent(kw.keyword)}&keywordId=${encodeURIComponent(kw.id)}`)}
                          className="text-xs text-white/20 hover:text-white/60 transition-colors"
                        >
                          Fix this →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
