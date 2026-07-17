"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { money } from "@/lib/format";

const COLORS = ["#6d5efc", "#21d07a", "#f7a53b", "#38bdf8", "#f6465d", "#a78bfa", "#34d399", "#fb923c"];

export interface Slice {
  symbol: string;
  value: number;
}

export function AllocationDonut({ slices, cash }: { slices: Slice[]; cash: number }) {
  const data = [...slices];
  if (cash > 0) data.push({ symbol: "Cash", value: cash });

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="symbol"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={d.symbol} fill={d.symbol === "Cash" ? "#3a4152" : COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#141821",
              border: "1px solid #242a37",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e8eaf0" }}
            itemStyle={{ color: "#949bad" }}
            formatter={(v) => money(Number(v))}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
