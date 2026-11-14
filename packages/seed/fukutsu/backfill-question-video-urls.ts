/**
 * 既存の一般質問レコードに video_url だけを後付けする。
 *
 * 使い方:
 *   cd packages/seed
 *   # ローカル
 *   npx dotenv -e ../../.env -- npx tsx fukutsu/backfill-question-video-urls.ts r8-6
 *   # 本番（--yes を付けないと確認だけして終わる）
 *   npx dotenv -e ../../.env.production -- npx tsx fukutsu/backfill-question-video-urls.ts r8-6 --yes
 *
 * 【なぜ要るか】
 * seed-session.ts は会期ごと「議案・一般質問をいったん全部削除してから入れ直す」方式。
 * bills/general_questions の id を明示せず insert しているため、DBが毎回新しい
 * UUIDを振る。/bills/{id}・/questions/{id} は素のUUIDをURLに使っているため、
 * 入れ直すたびにその会期の全URLが変わり、Googleに登録済みだったURLが軒並み404になる
 * （2026-09-18、Search Consoleの404急増から発覚）。
 *
 * video_url の後付けのように「既存の行の一部フィールドだけ直したい」場合は、
 * seed-session.ts を使わずこのスクリプトでUPDATEする。id（＝公開URL）は
 * 一切変えない。
 *
 * 対象は ATTENDANCE_RECORDINGS に録画データがある会期のうち、実データが
 * 既に入っている会期（r7-6, r7-9, r7-12, r8-3, r8-6）。record_kind =
 * 'attendance_only' の会期（議案データが無い星取表専用会期）はここでは扱わない
 * （それらは seed-session.ts が最初から video_url 込みで作成する）。
 */
import { createAdminClient } from "../shared/helper";
import { ATTENDANCE_RECORDINGS } from "./attendance-recordings-data";

type AdminClient = ReturnType<typeof createAdminClient>;

/** 会議録は「山本祐平」、シードは「山本 祐平」と全角スペースの有無が違う。突き合わせは空白を除いた形で行う */
function stripSpaces(name: string): string {
  return name.replace(/[\s　]/g, "");
}

async function findSessionId(
  supabase: AdminClient,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("council_sessions")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`council_sessions の取得に失敗しました: ${error.message}`);
  }
  return data?.id ?? null;
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith("--"));
  const confirmed = args.includes("--yes");

  const supportedSlugs = Object.keys(ATTENDANCE_RECORDINGS);

  if (!slug) {
    console.error(
      "usage: npx tsx fukutsu/backfill-question-video-urls.ts <session_slug> [--yes]\n" +
        `  会期: ${supportedSlugs.join(", ")}`
    );
    process.exit(1);
  }

  if (!supportedSlugs.includes(slug)) {
    console.error(
      `録画データが無い会期です: ${slug}\n  使えるのは: ${supportedSlugs.join(", ")}`
    );
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? "(不明)";
  const isProduction = !supabaseUrl.includes("127.0.0.1");

  const supabase = createAdminClient();
  const sessionId = await findSessionId(supabase, slug);
  if (!sessionId) {
    console.error(
      `会期 "${slug}" が council_sessions に見つかりません。先に会期を作成してください。`
    );
    process.exit(1);
  }

  const { data: questions, error } = await supabase
    .from("general_questions")
    .select("id, questioner_name, video_url")
    .eq("council_session_id", sessionId)
    .eq("record_kind", "question");

  if (error) {
    throw new Error(`一般質問の取得に失敗しました: ${error.message}`);
  }

  const recordingByName = new Map(
    (ATTENDANCE_RECORDINGS[slug] ?? []).map((r) => [
      stripSpaces(r.name),
      r.videoUrl,
    ])
  );

  const updates = (questions ?? [])
    .map((q) => ({
      id: q.id as string,
      questioner_name: q.questioner_name as string,
      currentUrl: q.video_url as string | null,
      newUrl: recordingByName.get(stripSpaces(q.questioner_name as string)),
    }))
    .filter((u) => u.newUrl != null && u.newUrl !== u.currentUrl);

  console.log("─".repeat(60));
  console.log(`接続先 : ${supabaseUrl}${isProduction ? "  ⚠️ 本番" : "（ローカル）"}`);
  console.log(`会期   : ${slug}`);
  console.log(
    `対象   : 一般質問${questions?.length ?? 0}件中、video_urlの差分あり${updates.length}件`
  );
  for (const u of updates) {
    console.log(`  - ${u.questioner_name}: ${u.currentUrl ?? "(無し)"} → ${u.newUrl}`);
  }
  console.log("─".repeat(60));

  if (updates.length === 0) {
    console.log("✅ 差分はありません。何もせず終了します。");
    return;
  }

  if (!confirmed) {
    console.log("確認のみで終了しました。実行するには --yes を付けてください。");
    return;
  }

  for (const u of updates) {
    const { error: updateError } = await supabase
      .from("general_questions")
      .update({ video_url: u.newUrl })
      .eq("id", u.id);

    if (updateError) {
      throw new Error(
        `"${u.questioner_name}" の更新に失敗しました: ${updateError.message}`
      );
    }
  }

  console.log(`✅ ${updates.length}件のvideo_urlを更新しました（idは変更していません）`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
