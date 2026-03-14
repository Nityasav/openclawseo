"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingDown, TrendingUp, Minus, Download, Search } from "lucide-react";
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
}

export function KeywordsTable({ keywords }: { keywords: Keyword[] }) {
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

  const SortHeader = ({ field, label }: { field: keyof Keyword; label: string }) => (
    <th
      className="cursor-pointer pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-900"
      onClick={() => handleSort(field)}
    >
      {label} {sortField === field ? (sortDir === "desc" ? "↓" : "↑") : ""}
    </th>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Keywords ({filtered.length})</CardTitle>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "top10", "11-20", "21-50"] as const).map((f) => (
              <Button
                key={f}
                variant={positionFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setPositionFilter(f)}
              >
                {f === "all" ? "All" : `Pos. ${f}`}
              </Button>
            ))}
          </div>
        </div>

        {keywords.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p>No keywords tracked yet.</p>
            <p className="mt-1 text-sm">Connect Google Search Console in Settings to import keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <SortHeader field="keyword" label="Keyword" />
                  <SortHeader field="current_position" label="Position" />
                  <th className="pb-3 pr-4 text-left text-xs font-medium uppercase text-gray-500">Change</th>
                  <SortHeader field="search_volume" label="Volume" />
                  <SortHeader field="difficulty" label="Difficulty" />
                  <SortHeader field="opportunity_score" label="Opportunity" />
                  <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((kw) => {
                  const delta = (kw.previous_position ?? kw.current_position ?? 0) - (kw.current_position ?? 0);
                  return (
                    <tr key={kw.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium">{kw.keyword}</td>
                      <td className="py-3 pr-4">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", getPositionBadgeColor(kw.current_position ?? 100))}>
                          {kw.current_position ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("flex items-center gap-1 text-xs font-medium", delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-400")}>
                          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          {delta !== 0 ? Math.abs(delta) : "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{kw.search_volume ? formatNumber(kw.search_volume) : "—"}</td>
                      <td className="py-3 pr-4">
                        {kw.difficulty != null ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-gray-200">
                              <div
                                className={cn("h-full rounded-full", kw.difficulty > 70 ? "bg-red-500" : kw.difficulty > 40 ? "bg-yellow-500" : "bg-green-500")}
                                style={{ width: `${kw.difficulty}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(kw.difficulty)}</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("font-semibold", getOpportunityColor(kw.opportunity_score ?? 0))}>
                          {kw.opportunity_score != null ? Math.round(kw.opportunity_score) : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" className="text-xs">Fix this →</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
