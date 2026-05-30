/**
 * 令和8年度当初予算の概要 シードスクリプト
 * r8-yosan-gaiyou-cards.json → budget_overviews / budget_themes / budget_initiatives
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

// 令和8年2月定例会 ID
const COUNCIL_SESSION_ID = "84bf7b1a-23e3-469d-ade2-caf9e149e732";

const HEADLINE =
  "チャレンジと安心！ 豊かな未来へ「翔」け上がる福岡県";

// section → スラグマッピング
const SECTION_SLUGS: Record<string, string> = {
  "人を育て、すべての人の活躍を応援する": "hito-wo-sodatete",
  "産業を育て、県経済を強くする": "sangyo-wo-sodatete",
  "人を惹きつける元気なまちをつくる": "hito-wo-hikitsukeru",
  "健全な環境と、安全・安心なくらしを守る": "kanzen-na-kankyo",
};

interface Card {
  section: string;
  subsection: string;
  title: string;
  budget_manyen: number | null;
  is_2gatsu_hose: boolean;
  is_keizoku: boolean;
  cost_name: string | null;
  descriptions: string[];
}

interface CardsData {
  fiscal_year: number;
  source: string;
  cards: Card[];
}

function toBadge(card: Card): "new" | "continued" | null {
  if (card.is_keizoku) return "continued";
  if (card.is_2gatsu_hose) return "new";
  return null;
}

async function run() {
  const jsonPath = path.resolve(
    __dirname,
    "../../../docs/data/r8-yosan-gaiyou-cards.json"
  );
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data: CardsData = JSON.parse(raw);

  console.log(`カード総数: ${data.cards.length}件`);

  // section ごとにグループ化
  const bySectionMap = new Map<string, Map<string, Card[]>>();
  for (const card of data.cards) {
    if (!bySectionMap.has(card.section)) {
      bySectionMap.set(card.section, new Map());
    }
    const bySubsection = bySectionMap.get(card.section)!;
    if (!bySubsection.has(card.subsection)) {
      bySubsection.set(card.subsection, []);
    }
    bySubsection.get(card.subsection)!.push(card);
  }

  // 既存データを削除（冪等性のため）
  console.log("既存データを削除中...");
  const { data: existingOverviews } = await supabase
    .from("budget_overviews")
    .select("id")
    .eq("council_session_id", COUNCIL_SESSION_ID);

  if (existingOverviews && existingOverviews.length > 0) {
    const overviewIds = existingOverviews.map((o) => o.id);
    // budget_themes → budget_initiatives は CASCADE で削除される
    await supabase
      .from("budget_overviews")
      .delete()
      .in("id", overviewIds);
    console.log(`  ${overviewIds.length}件の既存概要を削除しました`);
  }

  const sections = [...bySectionMap.keys()];
  let sectionOrder = 0;

  for (const sectionName of sections) {
    sectionOrder++;
    const slug = SECTION_SLUGS[sectionName] ?? `section-${sectionOrder}`;
    console.log(`\n[${sectionOrder}] ${sectionName} (${slug})`);

    // budget_overviews を作成
    const { data: overview, error: overviewError } = await supabase
      .from("budget_overviews")
      .insert({
        council_session_id: COUNCIL_SESSION_ID,
        department_name: sectionName,
        department_slug: slug,
        direction: HEADLINE,
        publish_status: "published",
        sort_order: sectionOrder,
      })
      .select("id")
      .single();

    if (overviewError || !overview) {
      console.error("  OverviewError:", overviewError);
      continue;
    }

    const bySubsection = bySectionMap.get(sectionName)!;
    let subsectionOrder = 0;

    for (const [subsectionName, cards] of bySubsection.entries()) {
      subsectionOrder++;
      console.log(`  [${subsectionOrder}] ${subsectionName} (${cards.length}件)`);

      // budget_themes を作成
      const { data: theme, error: themeError } = await supabase
        .from("budget_themes")
        .insert({
          overview_id: overview.id,
          title: subsectionName,
          sort_order: subsectionOrder,
        })
        .select("id")
        .single();

      if (themeError || !theme) {
        console.error("  ThemeError:", themeError);
        continue;
      }

      // budget_initiatives を一括挿入
      const initiatives = cards.map((card, idx) => ({
        theme_id: theme.id,
        title: card.title,
        budget_amount: card.budget_manyen
          ? card.budget_manyen * 10000 // 万円→円
          : null,
        badge: toBadge(card),
        description: card.descriptions.join("\n"),
        sort_order: idx + 1,
      }));

      const { error: initError } = await supabase
        .from("budget_initiatives")
        .insert(initiatives);

      if (initError) {
        console.error("  InitError:", initError);
      }
    }
  }

  console.log("\n✅ シード完了");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
