import type { BudgetYearEntry, JimuJigyoData } from "../types/jimu-jigyo";

// 事業費の年度別マップ（キー例: "R6決算" "R7当初" "R8当初" "R5決算" "R6当初"）から
// 目的の年度・種別のエントリを取り出すアクセサ群。
// 県の様式1号は「決算（過年度）」「当初（予算年度以降）」の2種別を持つ。

const YEAR_ORDER = ["R4", "R5", "R6", "R7", "R8", "R9", "R10"] as const;

function reiwaNum(year: string): number {
  return Number(year.replace(/^r/i, ""));
}

/** 指定年度・種別（決算/当初）の歳出エントリを返す */
export function getBudgetEntry(
  data: JimuJigyoData,
  year: string,
  kind: "決算" | "当初"
): BudgetYearEntry | undefined {
  const map = data.事業費?.年度別;
  if (!map) return undefined;
  const n = reiwaNum(year);
  // 完全一致（例: "R6決算"）を優先。補正列などの派生キーは対象外
  return map[`R${n}${kind}`];
}

/** 決算ベースの当年度歳出（評価対象年度の実績値）。 */
export function getSettlement(
  data: JimuJigyoData,
  year: string
): number | null {
  return getBudgetEntry(data, year, "決算")?.歳出 ?? null;
}

/** 当初予算ベースの歳出。 */
export function getInitial(data: JimuJigyoData, year: string): number | null {
  return getBudgetEntry(data, year, "当初")?.歳出 ?? null;
}

/**
 * 事業費推移をチャート用に時系列で返す。
 * 年度・種別（決算/当初）を昇順に並べ、決算→当初の順に整える。
 */
export function getBudgetTimeline(
  data: JimuJigyoData
): { label: string; 歳出: number; 一般財源: number; 種別: "決算" | "当初" }[] {
  const map = data.事業費?.年度別;
  if (!map) return [];
  const rows: {
    label: string;
    歳出: number;
    一般財源: number;
    種別: "決算" | "当初";
    sortKey: number;
  }[] = [];
  for (const [key, entry] of Object.entries(map)) {
    const m = key.match(/^R(\d+)(決算|当初)$/);
    if (!m) continue; // 補正列など派生キーはチャートに含めない
    const yearNum = Number(m[1]);
    const kind = m[2] as "決算" | "当初";
    const 歳出 = entry.歳出;
    if (歳出 == null) continue;
    const yearIdx = YEAR_ORDER.indexOf(
      `R${yearNum}` as (typeof YEAR_ORDER)[number]
    );
    rows.push({
      label: `R${yearNum}${kind}`,
      歳出,
      一般財源: entry.一般財源 ?? 0,
      種別: kind,
      // 決算(0)→当初(1)で同年内の並びを固定
      sortKey:
        (yearIdx < 0 ? yearNum : yearIdx) * 10 + (kind === "決算" ? 0 : 1),
    });
  }
  rows.sort((a, b) => a.sortKey - b.sortKey);
  return rows.map(({ sortKey: _sortKey, ...rest }) => rest);
}
