import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  JimuJigyoData,
  JimuJigyoRecord,
} from "../../shared/types/jimu-jigyo";
import { analyzeJimuJigyo } from "../../shared/utils/analysis";

// 年度メタデータ。新年度追加はここだけ変更する。
// analysisYear: 3軸分析の基準年（R7評価書の最新実績はR6）
export const YEAR_METADATA = [
  {
    slug: "r7",
    label: "令和7年度評価（令和6年度実績）",
    description: "266事業の見直し状況とKPI・予算・効率を分析",
    fiscalYear: 2025,
    analysisYear: "R6",
  },
] as const;

export type JimuJigyoYear = (typeof YEAR_METADATA)[number]["slug"];

export function isValidYear(year: string): year is JimuJigyoYear {
  return YEAR_METADATA.some((y) => y.slug === year);
}

export function getYearMeta(year: JimuJigyoYear) {
  const meta = YEAR_METADATA.find((y) => y.slug === year);
  if (!meta) throw new Error(`未知の年度: ${year}`);
  return meta;
}

// プロセス内メモ化（全事業を年度あたり1回だけ取得）。
// unstable_cache は使わない（再seed時のキー管理が不要）。
const cache = new Map<JimuJigyoYear, JimuJigyoRecord[]>();

export async function loadJimuJigyoList(
  year: JimuJigyoYear
): Promise<JimuJigyoRecord[]> {
  const cached = cache.get(year);
  if (cached) return cached;

  const meta = getYearMeta(year);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jimu_jigyo_evaluations")
    .select("raw_data, jimu_jigyo_items!inner(slug)")
    .eq("fiscal_year", meta.fiscalYear);

  if (error) {
    throw new Error(`事務事業評価の取得に失敗: ${error.message}`);
  }

  const records: JimuJigyoRecord[] = [];
  for (const row of data ?? []) {
    const raw = row.raw_data as unknown as JimuJigyoData | null;
    const item = row.jimu_jigyo_items as unknown as { slug: string } | null;
    if (!raw?.事業名 || !item?.slug) continue;
    records.push({
      ...raw,
      id: item.slug,
      analysis: analyzeJimuJigyo(raw, meta.analysisYear),
    });
  }

  records.sort((a, b) => a.整理番号 - b.整理番号);
  cache.set(year, records);
  return records;
}
