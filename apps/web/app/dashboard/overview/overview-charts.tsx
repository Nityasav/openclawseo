"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OverviewChartsProps {
  keywords: { current_position: number }[];
}

function generateTrendData() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      avgPosition: Math.round(12 + Math.sin(i * 0.3) * 4 + Math.random() * 2),
      top10Keywords: Math.round(8 + i * 0.3 + Math.random() * 2),
    });
  }
  return data;
}

export function OverviewCharts({ keywords }: OverviewChartsProps) {
  const trendData = generateTrendData();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-xs font-medium text-white/60 uppercase tracking-widest">Position Trend — 30 days</h3>
      </div>
      <div className="p-5">
        {keywords.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-white/20">No keyword data yet. Connect Google Search Console to get started.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
                tickLine={false}
                axisLine={false}
                reversed
                domain={[1, 30]}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.7)",
                }}
                itemStyle={{ color: "rgba(255,255,255,0.6)" }}
                labelStyle={{ color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}
              />
              <Line
                type="monotone"
                dataKey="avgPosition"
                name="Avg Position"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="top10Keywords"
                name="Top 10 Keywords"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
