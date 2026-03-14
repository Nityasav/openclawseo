"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface OverviewChartsProps {
  keywords: { current_position: number }[];
}

// Generate mock trend data for display purposes
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
    <Card>
      <CardHeader>
        <CardTitle>Keyword Position Trend (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {keywords.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-gray-400">
            <p>No keyword data yet. Connect Google Search Console to get started.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                reversed
                domain={[1, 30]}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgPosition"
                name="Avg Position"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="top10Keywords"
                name="Top 10 Keywords"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
