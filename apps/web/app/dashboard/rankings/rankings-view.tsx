"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { SparklineChart } from "./sparkline-chart";
import { cn, getPositionBadgeColor } from "@/lib/utils";

interface Keyword {
  id: string;
  keyword: string;
  current_position: number | null;
  previous_position: number | null;
  search_volume: number | null;
}

interface RankingsViewProps {
  keywords: Keyword[];
  significantDrops: Keyword[];
}

export function RankingsView({ keywords, significantDrops }: RankingsViewProps) {
  if (keywords.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-gray-400">
          <p className="text-lg font-medium">No ranking data yet</p>
          <p className="mt-1 text-sm">Connect Google Search Console to start tracking.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {significantDrops.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-700">
              {significantDrops.length} keyword{significantDrops.length > 1 ? "s" : ""} dropped significantly
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {significantDrops.slice(0, 3).map((kw) => kw.keyword).join(", ")}
              {significantDrops.length > 3 && ` +${significantDrops.length - 3} more`}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Keyword Rank Tracker ({keywords.length} keywords)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {keywords.slice(0, 30).map((kw) => {
              const delta = (kw.previous_position ?? kw.current_position ?? 0) - (kw.current_position ?? 0);
              const isDrop = delta < -5;
              return (
                <div
                  key={kw.id}
                  className={cn(
                    "rounded-lg border p-3",
                    isDrop && "border-red-200 bg-red-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium" title={kw.keyword}>
                      {kw.keyword}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                        getPositionBadgeColor(kw.current_position ?? 100)
                      )}
                    >
                      #{kw.current_position ?? "?"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <SparklineChart position={kw.current_position ?? 50} delta={delta} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>Vol: {kw.search_volume ? kw.search_volume.toLocaleString() : "—"}</span>
                    <span className={cn(delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "")}>
                      {delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : "stable"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {keywords.length > 30 && (
            <p className="mt-4 text-center text-sm text-gray-400">
              Showing 30 of {keywords.length} keywords
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
