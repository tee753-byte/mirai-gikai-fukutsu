import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * 検索ページ用に、公開済みの議案・発議・請願を会期名つきで取得する。
 *
 * 既存の findPublishedBillsWithContents は会期を結合していないが、検索では
 * 「令和8年3月定例会」で探せるようにしたいので、こちらに専用のクエリを置く。
 * Fork元の共通処理には手を入れず、福津版の追加分としてここに閉じ込めている。
 *
 * 【難易度で絞らない理由】
 * やさしい版とくわしい版では書いてある内容が違う。委員会での質疑応答の引用は
 * くわしい版にしかないため、読者が選んでいる難易度だけを検索すると取りこぼす。
 * 実際「福間南」は議案第54号のくわしい版にしか出てこない。
 * 検索は両方を対象にし、画面に出す文章だけを読者の設定にそろえる。
 */
export async function findSearchableBills() {
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
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch searchable bills: ${error.message}`);
  }

  return data;
}
