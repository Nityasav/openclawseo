"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  position: number;
  delta: number;
}

export function SparklineChart({ position, delta }: SparklineChartProps) {
  // Generate mock historical data based on current position + delta
  const data = Array.from({ length: 7 }, (_, i) => {
    const dayDelta = delta * (i / 6);
    const noise = (Math.random() - 0.5) * 2;
    return { v: Math.max(1, Math.round(position + dayDelta + noise)) };
  }).reverse();

  const color = delta > 2 ? "#10b981" : delta < -2 ? "#ef4444" : "#6b7280";

  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
