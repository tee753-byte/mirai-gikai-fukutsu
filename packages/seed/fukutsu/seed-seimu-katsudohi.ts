/**
 * 政務活動費（令和7年度分）のシードスクリプト。
 *
 * `pnpm seed`（全体入れ直し）には含めない。予算プロトタイプ同様、
 * このデータだけを単独で入れ直せるようにしておく。
 *
 * 使い方:
 *   # ローカル
 *   npx dotenv -e ../../.env -- npx tsx fukutsu/seed-seimu-katsudohi.ts --yes
 *   # 本番（--yes を付けないと確認だけして終わる。seed-session.ts と同じ方式）
 *   npx dotenv -e ../../.env.production -- npx tsx fukutsu/seed-seimu-katsudohi.ts --yes
 *
 * publish_status は常に draft で投入する。公開は別途、投入内容を確認したうえで
 * published に切り替える（このスクリプトではやらない）。
 */
import { createAdminClient } from "../shared/helper";
import {
  SEIMU_KATSUDOHI_R7_REPORTS,
  SEIMU_KATSUDOHI_R7_SOURCE_PAGE_URL,
} from "./seimu-katsudohi-r7";

const FISCAL_YEAR_SLUG = "r7";
const FISCAL_YEAR_LABEL = "令和7年度";

async function main() {
  const confirmed = process.argv.includes("--yes");

  const supabaseUrl = process.env.SUPABASE_URL ?? "(不明)";
  const isProduction = !supabaseUrl.includes("127.0.0.1");

  console.log("─".repeat(60));
  console.log(`接続先 : ${supabaseUrl}${isProduction ? "  ⚠️ 本番" : "（ローカル）"}`);
  console.log(`年度   : ${FISCAL_YEAR_LABEL} (${FISCAL_YEAR_SLUG})`);
  console.log(`件数   : ${SEIMU_KATSUDOHI_R7_REPORTS.length}件（会派・議員）`);
  console.log(`出典   : ${SEIMU_KATSUDOHI_R7_SOURCE_PAGE_URL}`);
  console.log("─".repeat(60));

  if (!confirmed) {
    console.log(
      "確認のみで終了しました。実行するには --yes を付けてください。"
    );
    return;
  }

  const supabase = createAdminClient();

  console.log("🧹 既存の令和7年度分を削除します（あれば）...");
  const { data: existing } = await supabase
    .from("seimu_katsudohi_reports")
    .select("id")
    .eq("fiscal_year_slug", FISCAL_YEAR_SLUG);
  if (existing && existing.length > 0) {
    const { error: deleteError } = await supabase
      .from("seimu_katsudohi_reports")
      .delete()
      .eq("fiscal_year_slug", FISCAL_YEAR_SLUG);
    if (deleteError) {
      throw new Error(`既存データの削除に失敗: ${deleteError.message}`);
    }
  }

  console.log("🌱 投入します...");
  let reportCount = 0;
  let itemCount = 0;

  for (const report of SEIMU_KATSUDOHI_R7_REPORTS) {
    const expenditureTotal = report.items.reduce(
      (sum, i) => sum + i.amount,
      0
    );
    const balanceAmount = report.incomeAmount - expenditureTotal;

    const { data: inserted, error: reportError } = await supabase
      .from("seimu_katsudohi_reports")
      .insert({
        fiscal_year_slug: FISCAL_YEAR_SLUG,
        fiscal_year_label: FISCAL_YEAR_LABEL,
        group_type: report.groupType,
        group_name: report.groupName,
        group_slug: report.groupSlug,
        member_names: report.memberNames,
        income_amount: report.incomeAmount,
        expenditure_total: expenditureTotal,
        balance_amount: balanceAmount,
        source_url: report.sourceUrl,
        publish_status: "draft",
      })
      .select("id")
      .single();

    if (reportError || !inserted) {
      throw new Error(
        `${report.groupName} の登録に失敗: ${reportError?.message}`
      );
    }
    reportCount += 1;

    const { data: items, error: itemsError } = await supabase
      .from("seimu_katsudohi_expenditure_items")
      .insert(
        report.items.map((i, index) => ({
          report_id: inserted.id,
          category: i.category,
          amount: i.amount,
          note: i.note,
          sort_order: index,
        }))
      )
      .select("id");

    if (itemsError) {
      throw new Error(
        `${report.groupName} の内訳登録に失敗: ${itemsError.message}`
      );
    }
    itemCount += items?.length ?? 0;

    console.log(
      `  ✓ ${report.groupName}（${report.groupType === "caucus" ? "会派" : "無会派"}）: ` +
        `収入${report.incomeAmount.toLocaleString()}円 / 支出${expenditureTotal.toLocaleString()}円 / 残額${balanceAmount.toLocaleString()}円`
    );
  }

  console.log("─".repeat(60));
  console.log(
    `✅ 完了しました（報告書 ${reportCount}件 / 内訳 ${itemCount}件）`
  );
  console.log(
    "※ publish_status は draft のまま登録しています。公開する際は published に切り替えてください。"
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
