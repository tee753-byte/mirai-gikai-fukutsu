"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { JimuJigyoData } from "../../shared/types/jimu-jigyo";
import { getBudgetTimeline } from "../../shared/utils/budget-accessor";

type Props = {
  data: JimuJigyoData;
};

/** 事業費推移（決算＝濃色／当初＝淡色）。一般財源＋特定財源の積み上げ棒 */
export function BudgetBarChart({ data }: Props) {
  const timeline = getBudgetTimeline(data);
  if (timeline.length === 0) return null;

  const rows = timeline.map((t) => ({
    label: t.label,
    種別: t.種別,
    一般財源: t.一般財源,
    特定財源: Math.max(t.歳出 - t.一般財源, 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-mirai-border)"
        />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          width={56}
          tickFormatter={(v) => Number(v).toLocaleString()}
        />
        <Tooltip
          formatter={(v, name) => [`${Number(v).toLocaleString()}千円`, name]}
        />
        <Legend />
        <Bar dataKey="一般財源" stackId="a" fill="var(--color-jimu-up)">
          {rows.map((r) => (
            <Cell
              key={`ippan-${r.label}`}
              fillOpacity={r.種別 === "当初" ? 0.5 : 1}
            />
          ))}
        </Bar>
        <Bar
          dataKey="特定財源"
          stackId="a"
          fill="var(--color-jimu-up-bg)"
          stroke="var(--color-jimu-up)"
        >
          {rows.map((r) => (
            <Cell
              key={`tokutei-${r.label}`}
              fillOpacity={r.種別 === "当初" ? 0.5 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
