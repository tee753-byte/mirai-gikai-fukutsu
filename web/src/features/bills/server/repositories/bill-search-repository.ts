import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";

/**
 * 検索ページ用に、公開済みの議案・発議・請願を会期名つきで取得する。
 *
 * 既存の findPublishedBillsWithContents は会期を結合していないが、検索では
 * 「令和8年3月定例会」で探せるようにしたいので、こちらに専用のクエリを置く。
 * Fork元の共通処理には手を入れず、福津版の追加分としてここに閉じ込めている。
 */
export async function findSearchableBills(
  difficultyLevel: DifficultyLevelEnum
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select(
      `
      *,
      bill_contents!inner (
        id,
        bill_id,
        title,
        summary,
        content,
        difficulty_level,
        created_at,
        updated_at
      ),
      council_sessions (
        id,
        name,
        slug,
        start_date
      )
    `
    )
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", difficultyLevel)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch searchable bills: ${error.message}`);
  }

  return data;
}
