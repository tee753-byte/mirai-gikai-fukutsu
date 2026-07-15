import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  SaiHyokaData,
  SaiHyokaRecord,
} from "../../shared/types/jimu-jigyo";
import { getYearMeta, type JimuJigyoYear } from "./load-jimu-jigyo-list";

const cache = new Map<JimuJigyoYear, SaiHyokaRecord[]>();

/** 公共事業再評価（様式3号総括表）の一覧を取得 */
export async function loadSaiHyokaList(
  year: JimuJigyoYear
): Promise<SaiHyokaRecord[]> {
  const cached = cache.get(year);
  if (cached) return cached;

  const meta = getYearMeta(year);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jimu_jigyo_reevaluations")
    .select("slug, raw_data")
    .eq("fiscal_year", meta.fiscalYear)
    .order("slug");

  if (error) {
    throw new Error(`公共事業再評価の取得に失敗: ${error.message}`);
  }

  const records: SaiHyokaRecord[] = [];
  for (const row of data ?? []) {
    const raw = row.raw_data as unknown as SaiHyokaData | null;
    if (!raw?.事業名称) continue;
    records.push({ ...raw, id: row.slug });
  }

  cache.set(year, records);
  return records;
}
