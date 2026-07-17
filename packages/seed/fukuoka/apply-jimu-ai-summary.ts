/**
 * 事務事業評価 AI概要 反映スクリプト
 *
 * docs/data/jimu-jigyo/r7/ai-summaries.json の AI生成概要を
 * jimu_jigyo_evaluations（R7=2025）と jimu_jigyo_reevaluations の
 * raw_data.ai概要 にマージする。
 *
 * - 冪等: ai概要 キーの上書きのみ。他のフィールドには触れない
 * - 対応する行が見つからない slug が1件でもあれば全体を失敗させる
 *   （seed とデータファイルのズレを検知するため）
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const FISCAL_YEAR_R7 = 2025;

interface JimuSummary {
  slug: string;
  事業説明: string;
  推移の解説: string;
  見直しの意味: string;
}
interface SaiHyokaSummary {
  slug: string;
  平易な説明: string;
}
interface SummaryFile {
  jimu: JimuSummary[];
  saihyoka: SaiHyokaSummary[];
}

async function main() {
  const dataPath = path.resolve(
    __dirname,
    "../../../docs/data/jimu-jigyo/r7/ai-summaries.json",
  );
  const summaries: SummaryFile = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(
    `AI概要: 事務事業 ${summaries.jimu.length}件 / 再評価 ${summaries.saihyoka.length}件`,
  );
  console.log(`接続先: ${SUPABASE_URL}`);

  // ─── 事務事業評価（R7） ───
  const { data: items, error: itemsErr } = await supabase
    .from("jimu_jigyo_items")
    .select("id, slug");
  if (itemsErr) throw itemsErr;
  const itemBySlug = new Map(items.map((i) => [i.slug, i.id]));

  const { data: evals, error: evalsErr } = await supabase
    .from("jimu_jigyo_evaluations")
    .select("id, item_id, raw_data")
    .eq("fiscal_year", FISCAL_YEAR_R7);
  if (evalsErr) throw evalsErr;
  const evalByItemId = new Map(evals.map((e) => [e.item_id, e]));

  const missingJimu: string[] = [];
  let updatedJimu = 0;
  for (const s of summaries.jimu) {
    const itemId = itemBySlug.get(s.slug);
    const row = itemId ? evalByItemId.get(itemId) : undefined;
    if (!row) {
      missingJimu.push(s.slug);
      continue;
    }
    const rawData = row.raw_data as Record<string, unknown>;
    const { error } = await supabase
      .from("jimu_jigyo_evaluations")
      .update({
        raw_data: {
          ...rawData,
          ai概要: {
            事業説明: s.事業説明,
            推移の解説: s.推移の解説,
            見直しの意味: s.見直しの意味,
          },
        },
      })
      .eq("id", row.id);
    if (error) throw error;
    updatedJimu++;
  }

  // ─── 公共事業再評価 ───
  const { data: saiRows, error: saiErr } = await supabase
    .from("jimu_jigyo_reevaluations")
    .select("id, slug, raw_data")
    .eq("fiscal_year", FISCAL_YEAR_R7);
  if (saiErr) throw saiErr;
  const saiBySlug = new Map(saiRows.map((r) => [r.slug, r]));

  const missingSai: string[] = [];
  let updatedSai = 0;
  for (const s of summaries.saihyoka) {
    const row = saiBySlug.get(s.slug);
    if (!row) {
      missingSai.push(s.slug);
      continue;
    }
    const rawData = row.raw_data as Record<string, unknown>;
    const { error } = await supabase
      .from("jimu_jigyo_reevaluations")
      .update({
        raw_data: { ...rawData, ai概要: { 平易な説明: s.平易な説明 } },
      })
      .eq("id", row.id);
    if (error) throw error;
    updatedSai++;
  }

  console.log(`更新: 事務事業 ${updatedJimu}件 / 再評価 ${updatedSai}件`);
  if (missingJimu.length > 0 || missingSai.length > 0) {
    throw new Error(
      `DBに対応行が無い slug があります。seed 済みか確認してください。\n` +
        `事務事業: ${missingJimu.join(", ") || "なし"}\n` +
        `再評価: ${missingSai.join(", ") || "なし"}`,
    );
  }
  console.log("完了");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
