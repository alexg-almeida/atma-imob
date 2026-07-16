"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { leadsPerMonth } from "@/lib/mock-data";

const PRIMARY = "#005eb8";
const LINE = "#d8dadb";
const MUTED = "#5c6366";
const INK = "#222222";
const BG = "#f5f5f5";

export function LeadsLineChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={leadsPerMonth} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={LINE} strokeDasharray="2 4" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: MUTED, fontSize: 11, fontFamily: "var(--font-mono)" }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={36}
            ticks={[0, 12, 24, 36]}
            tick={{ fill: MUTED, fontSize: 11, fontFamily: "var(--font-mono)" }}
          />
          <Tooltip
            cursor={{ stroke: MUTED, strokeDasharray: "2 4" }}
            contentStyle={{
              borderRadius: 6,
              border: `1px solid ${LINE}`,
              background: BG,
              boxShadow: "0 8px 24px rgba(34, 34, 34, 0.14)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: INK,
            }}
            formatter={(value) => [`${value} leads`, ""]}
          />
          <Line
            type="monotone"
            dataKey="leads"
            stroke={PRIMARY}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: PRIMARY }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
