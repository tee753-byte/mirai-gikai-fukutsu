/**
 * 事務事業評価（令和7年度）シードスクリプト
 *
 * docs/data/jimu-jigyo/ の抽出済みJSONを
 * jimu_jigyo_bureaus / jimu_jigyo_items / jimu_jigyo_evaluations /
 * jimu_jigyo_reevaluations へ投入する。
 *
 * - R7の raw_data には R6評価書（matching.json で対応付け）由来の
 *   R5決算・R6当初をマージし、事業費推移を最大5点に延長する。
 *   重複年度（R6決算・R7当初）は最新のR7評価書を正とする
 * - 概要一覧（gaiyou.json）の「事業の内容」「主な指標の状況」を
 *   表示用テキストとして raw_data に付与する（様式1号の事業概要は
 *   スキーム図が多くテキスト抽出できないため）
 * - 冪等: bureaus は upsert、items（cascade で evaluations も）と
 *   reevaluations は削除→挿入
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// R7年度評価 = 2025年度
const FISCAL_YEAR_R7 = 2025;
const FISCAL_YEAR_R6 = 2024;

// 親部局コード（県の組織順）
const BUREAUS: { code: string; name: string }[] = [
  { code: "somu", name: "総務部" },
  { code: "kikaku", name: "企画・地域振興部" },
  { code: "hitozukuri", name: "人づくり・県民生活部" },
  { code: "hoken", name: "保健医療介護部" },
  { code: "fukushi", name: "福祉労働部" },
  { code: "kankyo", name: "環境部" },
  { code: "shoko", name: "商工部" },
  { code: "norin", name: "農林水産部" },
  { code: "kendo", name: "県土整備部" },
  { code: "kenchiku", name: "建築都市部" },
  { code: "kyoiku", name: "教育庁" },
  { code: "keisatsu", name: "警察本部" },
];

function parentBureauCode(bureauName: string): string {
  const hit = BUREAUS.find((b) => bureauName.startsWith(b.name));
  if (!hit) {
    throw new Error(`未知の部局: ${bureauName}`);
  }
  return hit.code;
}

interface HyokaItem {
  整理番号: number;
  事業名: string;
  部局: string;
  課室: string | null;
  事業費: {
    年度別: Record<string, { 歳出?: number | null; 一般財源?: number | null }>;
    人件費: Record<string, { 時間?: number | null; 千円?: number | null }> | null;
  } | null;
  見直し: {
    大区分: string | null;
    小区分: string | null;
    理由: string | null;
    内容: string | null;
  };
  出典: { pdf: string; 印字ページ: number | null; pdfページ: number };
  [key: string]: unknown;
}

interface GaiyouRow {
  no: number;
  事業名: string;
  ねらい目的: string | null;
  事業の内容: string | null;
  主な指標の状況: string | null;
}

interface MatchRow {
  r7整理番号: number;
  r6整理番号: number | null;
  method: string;
}

interface SaihyokaRow {
  担当部課: string;
  事業名称: string;
  [key: string]: unknown;
}

function loadJson<T>(rel: string): T {
  const p = path.resolve(__dirname, "../../../docs/data/jimu-jigyo", rel);
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

async function run() {
  const r7Items = loadJson<HyokaItem[]>("r7/items.json");
  const gaiyou = loadJson<GaiyouRow[]>("r7/gaiyou.json");
  const r6Items = loadJson<HyokaItem[]>("r6/items.json");
  const matching = loadJson<MatchRow[]>("matching.json");
  const saihyoka = loadJson<SaihyokaRow[]>("r7/saihyoka.json");

  const gaiyouByNo = new Map(gaiyou.map((g) => [g.no, g]));
  const r6ByNo = new Map(r6Items.map((it) => [it.整理番号, it]));
  const matchByR7 = new Map(matching.map((m) => [m.r7整理番号, m]));

  console.log(
    `入力: R7=${r7Items.length}件 / R6=${r6Items.length}件 / 再評価=${saihyoka.length}件`
  );

  // 1. 部局マスタ upsert
  const { error: bureauError } = await supabase.from("jimu_jigyo_bureaus").upsert(
    BUREAUS.map((b, i) => ({
      code: b.code,
      name: b.name,
      display_order: i + 1,
    })),
    { onConflict: "code" }
  );
  if (bureauError) throw new Error(`bureaus upsert失敗: ${bureauError.message}`);
  console.log(`部局マスタ: ${BUREAUS.length}件 upsert`);

  // 2. 既存データ削除（冪等性。evaluations は cascade）
  await supabase
    .from("jimu_jigyo_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase
    .from("jimu_jigyo_reevaluations")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("既存の items / reevaluations を削除");

  // 3. items + evaluations
  let merged5yo = 0;
  for (const item of r7Items) {
    const no = item.整理番号;
    const bureauCode = parentBureauCode(item.部局);
    const slug = `${bureauCode}-${String(no).padStart(3, "0")}`;

    const { data: inserted, error: itemError } = await supabase
      .from("jimu_jigyo_items")
      .insert({ slug, name: item.事業名, bureau_code: bureauCode })
      .select("id")
      .single();
    if (itemError || !inserted) {
      throw new Error(`items insert失敗 (No.${no}): ${itemError?.message}`);
    }

    // 概要一覧テキストの付与
    const g = gaiyouByNo.get(no);
    const rawData: Record<string, unknown> = {
      ...item,
      概要一覧: g
        ? {
            事業の内容: g.事業の内容,
            主な指標の状況: g.主な指標の状況,
            ねらい目的: g.ねらい目的,
          }
        : null,
    };

    // R6評価書由来の予算マージ（R5決算・R6当初のみ。重複年度はR7評価書を正とする）
    const match = matchByR7.get(no);
    const r6 = match?.r6整理番号 != null ? r6ByNo.get(match.r6整理番号) : undefined;
    if (r6?.事業費?.年度別 && item.事業費?.年度別) {
      const merged = { ...item.事業費.年度別 };
      let added = false;
      for (const col of ["R5決算", "R6当初"]) {
        if (r6.事業費.年度別[col] && !merged[col]) {
          merged[col] = r6.事業費.年度別[col];
          added = true;
        }
      }
      if (added) {
        merged5yo++;
        rawData.事業費 = {
          ...item.事業費,
          年度別: merged,
          過年度出典: {
            マッチ方式: match!.method,
            pdf: r6.出典.pdf,
            印字ページ: r6.出典.印字ページ,
          },
        };
      }
    }

    const evaluations = [
      {
        item_id: inserted.id,
        fiscal_year: FISCAL_YEAR_R7,
        raw_data: rawData,
        source_pdf: item.出典.pdf,
        source_page: item.出典.印字ページ,
      },
      // 過年度評価書があれば出典保存として保持
      ...(r6
        ? [
            {
              item_id: inserted.id,
              fiscal_year: FISCAL_YEAR_R6,
              raw_data: r6 as unknown as Record<string, unknown>,
              source_pdf: r6.出典.pdf,
              source_page: r6.出典.印字ページ,
            },
          ]
        : []),
    ];
    const { error: evalError } = await supabase
      .from("jimu_jigyo_evaluations")
      .insert(evaluations);
    if (evalError) {
      throw new Error(`evaluations insert失敗 (No.${no}): ${evalError.message}`);
    }
  }
  console.log(
    `items: ${r7Items.length}件 / 過年度予算マージ: ${merged5yo}件`
  );

  // 4. 公共事業再評価
  const reevals = saihyoka.map((s, i) => ({
    slug: `koukyo-${String(i + 1).padStart(3, "0")}`,
    fiscal_year: FISCAL_YEAR_R7,
    raw_data: s as unknown as Record<string, unknown>,
    source_pdf: (s as { page?: number }).page != null ? "810515_62838394_misc.pdf" : null,
    source_page: (s as { page?: number }).page ?? null,
  }));
  const { error: reevalError } = await supabase
    .from("jimu_jigyo_reevaluations")
    .insert(reevals);
  if (reevalError) throw new Error(`reevaluations insert失敗: ${reevalError.message}`);
  console.log(`公共事業再評価: ${reevals.length}件`);

  // 5. 検証サマリー
  const { count: itemCount } = await supabase
    .from("jimu_jigyo_items")
    .select("*", { count: "exact", head: true });
  const { count: evalCount } = await supabase
    .from("jimu_jigyo_evaluations")
    .select("*", { count: "exact", head: true });
  const { data: dist } = await supabase
    .from("jimu_jigyo_evaluations")
    .select("review_major, review_minor")
    .eq("fiscal_year", FISCAL_YEAR_R7);
  const counter = new Map<string, number>();
  for (const row of dist ?? []) {
    const key = `${row.review_major}(${row.review_minor})`;
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }
  console.log(`\n検証: items=${itemCount} evaluations=${evalCount}`);
  console.log("見直し区分分布(R7):", Object.fromEntries(counter));
  console.log("\n✅ シード完了");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
