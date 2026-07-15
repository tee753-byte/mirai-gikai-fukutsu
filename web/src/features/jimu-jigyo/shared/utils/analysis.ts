import type {
  BudgetAnalysisResult,
  ChangeDirection,
  EfficiencyAnalysisResult,
  JimuJigyoAnalysis,
  JimuJigyoData,
  KpiAnalysisResult,
  PrefKpiItem,
  ReiwaYear,
} from "../types/jimu-jigyo";
import { getBudgetEntry } from "./budget-accessor";

// 福岡県版の3軸方向分析。
// - KPI: 成果指標[0] の 実績R(n-1)→R(n)。県は達成率列がないため 実績/目標 の生値で算出
// - 予算: 決算R(n-1)→決算R(n)（過年度突合済み事業のみ）＋ 当初R(n+1)→R(n+2) の次年度方向
// - 効率: 目標達成率の平均 ÷ 歳出 の前年比（両年度の決算が揃う事業のみ）
// 方向閾値は市版同様 ±5%。

// 欠測を表す語彙（数値化しない）
const MISSING_VALUES = new Set([
  "調査中",
  "集計中",
  "未把握",
  "調査未実施",
  "-",
  "－",
  "—",
  "",
]);

function toNum(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    const t = val.trim();
    if (MISSING_VALUES.has(t)) return null;
    // 「9億」「1,205」等はそのまま数値化できる範囲で
    const cleaned = t.replace(/,/g, "").replace(/%/g, "");
    const n = Number(cleaned);
    return Number.isNaN(n) ? null : n;
  }
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

function direction(rate: number | null): ChangeDirection {
  if (rate === null) return "unknown";
  if (rate >= 0.05) return "up";
  if (rate <= -0.05) return "down";
  return "flat";
}

function pct(rate: number): string {
  const sign = rate >= 0 ? "+" : "";
  return `${sign}${(rate * 100).toFixed(1)}%`;
}

/** 達成率(%) = 実績 / 目標 × 100。定性目標や欠測は null */
function achievement(kpi: PrefKpiItem, year: ReiwaYear): number | null {
  const actual = toNum(kpi.実績?.[year]);
  const target = toNum(kpi.目標?.[year]);
  if (actual === null || target === null || target === 0) return null;
  return (actual / target) * 100;
}

// ─── KPI分析 ─────────────────────────────────────────────────

export function analyzeKpi(
  data: JimuJigyoData,
  year: string = "R6"
): KpiAnalysisResult {
  const n = Number(year.replace(/^r/i, ""));
  const currKey = `R${n}` as ReiwaYear;
  const prevKey = `R${n - 1}` as ReiwaYear;
  const currLabel = `令和${n}年度`;
  const prevLabel = `令和${n - 1}年度`;

  const kpis = data.成果指標 ?? [];
  if (kpis.length === 0) {
    return {
      direction: "unknown",
      changeRate: null,
      achievementRate: null,
      text: "成果指標が数値で設定されていません（進捗状況は記述で公表）。",
    };
  }

  const primary = kpis[0];
  const label = primary.内容;
  const prevVal = toNum(primary.実績?.[prevKey]);
  const currVal = toNum(primary.実績?.[currKey]);
  const achievementRate = achievement(primary, currKey);

  if (currVal === null) {
    return {
      direction: "unknown",
      changeRate: null,
      achievementRate,
      text: `「${label}」の${currLabel}実績が数値で得られていません（調査中または定性目標）。`,
    };
  }

  if (prevVal === null || prevVal === 0) {
    const achText =
      achievementRate !== null
        ? `目標に対する達成率は${achievementRate.toFixed(1)}%です。`
        : "";
    return {
      direction: "unknown",
      changeRate: null,
      achievementRate,
      text: `「${label}」の${currLabel}実績は${currVal.toLocaleString()}です。${achText}`,
    };
  }

  const changeRate = (currVal - prevVal) / prevVal;
  const dir = direction(changeRate);
  const achText =
    achievementRate !== null
      ? `目標に対する達成率は${achievementRate.toFixed(1)}%です。`
      : "";

  let trend: string;
  if (changeRate >= 0.1)
    trend = `前年度比${pct(changeRate)}と大幅に改善しました。`;
  else if (changeRate >= 0.05)
    trend = `前年度比${pct(changeRate)}と改善しました。`;
  else if (changeRate >= -0.05)
    trend = `前年度とほぼ同水準です（${pct(changeRate)}）。`;
  else if (changeRate >= -0.1)
    trend = `前年度比${pct(changeRate)}とやや悪化しました。`;
  else trend = `前年度比${pct(changeRate)}と大幅に悪化しました。`;

  return {
    direction: dir,
    changeRate,
    achievementRate,
    text: `「${label}」は${prevLabel}の${prevVal.toLocaleString()}から${currLabel}の${currVal.toLocaleString()}へ${trend}${achText}`,
  };
}

// ─── 予算分析 ─────────────────────────────────────────────────

export function analyzeBudget(
  data: JimuJigyoData,
  year: string = "R6"
): BudgetAnalysisResult {
  const n = Number(year.replace(/^r/i, ""));
  const prev = getBudgetEntry(data, `R${n - 1}`, "決算")?.歳出;
  const curr = getBudgetEntry(data, `R${n}`, "決算")?.歳出;

  // 次年度方向: 当初(n+1) → 当初(n+2)
  const initCurr = getBudgetEntry(data, `R${n + 1}`, "当初")?.歳出;
  const initNext = getBudgetEntry(data, `R${n + 2}`, "当初")?.歳出;
  let nextYearDirection: ChangeDirection = "unknown";
  let nextYearChangeRate: number | null = null;
  if (initCurr != null && initNext != null && initCurr > 0) {
    nextYearChangeRate = (initNext - initCurr) / initCurr;
    nextYearDirection = direction(nextYearChangeRate);
  }

  if (prev == null || curr == null || prev === 0) {
    const nextText =
      nextYearChangeRate !== null
        ? `翌年度当初予算は前年比${pct(nextYearChangeRate)}の見込みです。`
        : "過年度の決算が揃わないため決算ベースの増減は算出できません。";
    return {
      direction: "unknown",
      changeRate: null,
      nextYearDirection,
      nextYearChangeRate,
      text: nextText,
    };
  }

  const changeRate = (curr - prev) / prev;
  const dir = direction(changeRate);

  let trend: string;
  if (changeRate >= 0.3)
    trend = `決算歳出は前年度の${prev.toLocaleString()}千円から${curr.toLocaleString()}千円へ${pct(changeRate)}と大幅に増加しています。`;
  else if (changeRate >= 0.05)
    trend = `決算歳出は前年度の${prev.toLocaleString()}千円から${curr.toLocaleString()}千円へ${pct(changeRate)}増加しています。`;
  else if (changeRate >= -0.05)
    trend = `決算歳出は前年度の${prev.toLocaleString()}千円からほぼ横ばいです（${pct(changeRate)}）。`;
  else
    trend = `決算歳出は前年度の${prev.toLocaleString()}千円から${curr.toLocaleString()}千円へ${pct(changeRate)}削減されました。`;

  const nextText =
    nextYearChangeRate !== null
      ? `翌年度当初予算は前年比${pct(nextYearChangeRate)}の見込みです。`
      : "";

  return {
    direction: dir,
    changeRate,
    nextYearDirection,
    nextYearChangeRate,
    text: [trend, nextText].filter(Boolean).join(""),
  };
}

// ─── 効率分析 ─────────────────────────────────────────────────

export function analyzeEfficiency(
  data: JimuJigyoData,
  year: string = "R6"
): EfficiencyAnalysisResult {
  const n = Number(year.replace(/^r/i, ""));
  const prevBudget = getBudgetEntry(data, `R${n - 1}`, "決算")?.歳出;
  const currBudget = getBudgetEntry(data, `R${n}`, "決算")?.歳出;
  const currKey = `R${n}` as ReiwaYear;
  const prevKey = `R${n - 1}` as ReiwaYear;

  if (prevBudget == null || currBudget == null || prevBudget === 0) {
    return {
      direction: "unknown",
      changeRate: null,
      text: "過年度の決算が揃わないため、予算効率の変化は算出できません。",
    };
  }

  const kpis = data.成果指標 ?? [];
  const pairs = kpis
    .map((k) => ({
      prev: achievement(k, prevKey),
      curr: achievement(k, currKey),
    }))
    .filter(
      (p): p is { prev: number; curr: number } =>
        p.prev !== null && p.curr !== null
    );

  if (pairs.length === 0) {
    const budgetChange = (currBudget - prevBudget) / prevBudget;
    if (Math.abs(budgetChange) <= 0.05) {
      return {
        direction: "flat",
        changeRate: null,
        text: "達成率の数値が不足しているため定量的な効率分析は困難ですが、決算はほぼ横ばいです。",
      };
    }
    return {
      direction: budgetChange > 0.05 ? "down" : "up",
      changeRate: null,
      text: `達成率の数値が不足しているため定量的な効率分析は困難です。決算は前年度比${pct(budgetChange)}変化しています。`,
    };
  }

  const prevAvg = pairs.reduce((a, p) => a + p.prev, 0) / pairs.length;
  const currAvg = pairs.reduce((a, p) => a + p.curr, 0) / pairs.length;
  if (prevAvg === 0) {
    return {
      direction: "unknown",
      changeRate: null,
      text: "前年度の達成率が0のため効率変化を算出できません。",
    };
  }

  const prevEff = prevAvg / prevBudget;
  const currEff = currAvg / currBudget;
  const changeRate = (currEff - prevEff) / prevEff;
  const dir = direction(changeRate);

  let text: string;
  if (changeRate >= 0.1)
    text = `達成率が向上し決算も効率化されており、コスト効率は${pct(changeRate)}改善しています。`;
  else if (changeRate >= 0.01)
    text = `コスト効率は${pct(changeRate)}とわずかに改善しています。`;
  else if (changeRate >= -0.05)
    text = `コスト効率はほぼ横ばいです（${pct(changeRate)}）。`;
  else if (changeRate >= -0.15)
    text = `コスト効率は${pct(changeRate)}とやや低下しています。`;
  else
    text = `コスト効率は${pct(changeRate)}と低下しています。決算が増加した一方で達成率が伴っていません。`;

  return { direction: dir, changeRate, text };
}

export function analyzeJimuJigyo(
  data: JimuJigyoData,
  year: string = "R6"
): JimuJigyoAnalysis {
  return {
    kpi: analyzeKpi(data, year),
    budget: analyzeBudget(data, year),
    efficiency: analyzeEfficiency(data, year),
  };
}
