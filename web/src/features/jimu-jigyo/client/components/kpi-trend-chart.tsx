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
import type { PrefKpiItem, ReiwaYear } from "../../shared/types/jimu-jigyo";

type Props = {
  kpi: PrefKpiItem;
};

function toNum(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    const cleaned = val.trim().replace(/,/g, "").replace(/%/g, "");
    const n = Number(cleaned);
    return Number.isNaN(n) ? null : n;
  }
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

/** 成果指標の目標・実績を年度順に折れ線で描く */
export function KpiTrendChart({ kpi }: Props) {
  const years = [
    ...new Set([
      ...Object.keys(kpi.目標 ?? {}),
      ...Object.keys(kpi.実績 ?? {}),
    ]),
  ]
    .filter((k): k is ReiwaYear => /^R\d+$/.test(k))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

  const data = years.map((yr) => ({
    year: yr,
    目標: toNum(kpi.目標?.[yr]),
    実績: toNum(kpi.実績?.[yr]),
  }));

  const actualCount = data.filter((d) => d.実績 !== null).length;
  if (actualCount < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-mirai-border)"
        />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          width={48}
          allowDecimals={false}
          tickFormatter={(v) => Math.round(Number(v)).toLocaleString()}
        />
        <Tooltip
          formatter={(v, name) => [
            v === null ? "―" : Math.round(Number(v)).toLocaleString(),
            name,
          ]}
        />
        <Line
          dataKey="目標"
          stroke="var(--color-mirai-text-muted)"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          dataKey="実績"
          stroke="var(--color-jimu-up)"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
