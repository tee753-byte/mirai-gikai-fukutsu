/**
 * 1会期ぶんのデータだけを入れ替える。
 *
 * 使い方:
 *   cd packages/seed
 *   # ローカル
 *   npx dotenv -e ../../.env -- npx tsx fukutsu/seed-session.ts r8-3
 *   # 本番（--yes を付けないと確認だけして終わる）
 *   npx dotenv -e ../../.env.production -- npx tsx fukutsu/seed-session.ts r8-3 --yes
 *
 * 【なぜ要るか】
 * pnpm seed は全データを削除してから入れ直す（clearAllData）。公開後にこれを
 * 走らせると、その瞬間サイト全体が空になる。会期ごとに入れ替えれば、
 * 影響の範囲がその会期だけに収まる。
 *
 * 【消えるもの】
 * 指定した会期の議案と一般質問。議案を消すと、その議案にぶら下がる
 * 説明・タグ・討論・提出者・議員別賛否も外部キーの設定で一緒に消える。
 * 会期そのもの（council_sessions）と、市全体で共通のもの（タグ・委員会・
 * 会派・議員）は消さない。
 *
 * 【消えないもの】
 * 会期を新しく作ることはしない。council_sessions に無い会期を指定すると
 * 何もせずに終わる。会期の追加は run.ts（pnpm seed）で行う。
 */
import { createAdminClient } from "../shared/helper";
import { R8_3_SESSION_SLUG } from "./bills-r8-3";
import { seedBillsForSession } from "./seed-bills-common";
import { seedBillsR8_3 } from "./seed-bills-r8-3";
import { seedBudgetR8_3 } from "./seed-budget-r8-3";
import {
  findGeneralQuestions,
  seedGeneralQuestionsForSession,
} from "./seed-general-questions";
import { seedMemberVotes } from "./seed-member-votes";
import { seedMemberVotesR7_12 } from "./seed-member-votes-r7-12";
import { FUKUTSU_SESSIONS } from "./sessions";

type AdminClient = ReturnType<typeof createAdminClient>;

/** 入れ替えの対象にできる会期。r8-3 は個別実装があるので別扱い */
const SUPPORTED_SLUGS = [
  R8_3_SESSION_SLUG,
  ...FUKUTSU_SESSIONS.map((s) => s.slug),
];

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

/** 入れ替え前に、いま何件入っているかを数える */
async function countExisting(
  supabase: AdminClient,
  sessionId: string
): Promise<{ bills: number; questions: number }> {
  const bills = await supabase
    .from("bills")
    .select("id", { count: "exact", head: true })
    .eq("council_session_id", sessionId);
  const questions = await supabase
    .from("general_questions")
    .select("id", { count: "exact", head: true })
    .eq("council_session_id", sessionId);

  return { bills: bills.count ?? 0, questions: questions.count ?? 0 };
}

async function deleteSessionData(
  supabase: AdminClient,
  sessionId: string,
  slug: string
): Promise<void> {
  // 議案を消すと、説明・タグ・討論・提出者・議員別賛否も一緒に消える
  // （すべて bills(id) への外部キーが on delete cascade）
  const bills = await supabase
    .from("bills")
    .delete()
    .eq("council_session_id", sessionId);
  if (bills.error) {
    throw new Error(`議案の削除に失敗しました: ${bills.error.message}`);
  }

  const questions = await supabase
    .from("general_questions")
    .delete()
    .eq("council_session_id", sessionId);
  if (questions.error) {
    throw new Error(`一般質問の削除に失敗しました: ${questions.error.message}`);
  }

  // 予算は令和8年3月定例会にだけ紐づいている
  if (slug === R8_3_SESSION_SLUG) {
    const budget = await supabase
      .from("budget_overviews")
      .delete()
      .eq("council_session_id", sessionId);
    if (budget.error) {
      throw new Error(`予算の削除に失敗しました: ${budget.error.message}`);
    }
  }
}

async function insertSessionData(
  supabase: AdminClient,
  sessionId: string,
  slug: string
): Promise<void> {
  const { data: tags } = await supabase.from("tags").select("id, label");
  const { data: committees } = await supabase
    .from("committees")
    .select("id, name");

  const tagIdByLabel = new Map(
    (tags ?? []).map((t: { id: string; label: string }) => [t.label, t.id])
  );
  const committeeIdByName = new Map(
    (committees ?? []).map((c: { id: string; name: string }) => [c.name, c.id])
  );

  if (tagIdByLabel.size === 0 || committeeIdByName.size === 0) {
    throw new Error(
      "タグまたは委員会が1件も登録されていません。先に pnpm seed で全体を作ってください。"
    );
  }

  if (slug === R8_3_SESSION_SLUG) {
    await seedBillsR8_3(supabase, sessionId, tagIdByLabel, committeeIdByName);
    const budget = await seedBudgetR8_3(supabase, sessionId);
    console.log(
      `✅ 予算: 概要${budget.overviewCount}件・テーマ${budget.themeCount}件・事業${budget.initiativeCount}件`
    );
  } else {
    const session = FUKUTSU_SESSIONS.find((s) => s.slug === slug);
    if (!session) throw new Error(`会期の定義が見つかりません: ${slug}`);

    await seedBillsForSession({
      supabase,
      sessionId,
      tagIdByLabel,
      committeeIdByName,
      slugLabel: session.label,
      // biome-ignore lint/suspicious/noExplicitAny: JSON importの型を合わせるための簡易キャスト
      votes: session.votes as any,
      plainTexts: session.plainTexts,
      sourceUrl: session.sourceUrl,
      documentsFile: session.documentsFile,
      hasMinutes: session.hasMinutes ?? true,
      hasMemberVotes: session.hasMemberVotes ?? true,
      decidedAt: session.decidedAt,
      submittedAt: session.submittedAt,
    });
  }

  // 議員別の賛否は市議会だよりの賛否表から作る。会期によって出どころが違う
  const memberVotes =
    slug === "r7-12"
      ? await seedMemberVotesR7_12(supabase, [sessionId])
      : await seedMemberVotes(supabase, [sessionId]);
  console.log(`✅ 議員別の賛否: ${memberVotes}件`);

  const questions = findGeneralQuestions(slug);
  if (questions) {
    const count = await seedGeneralQuestionsForSession(
      supabase,
      sessionId,
      questions
    );
    console.log(`✅ 一般質問: ${count}件`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith("--"));
  const confirmed = args.includes("--yes");

  if (!slug) {
    console.error(
      "usage: npx tsx fukutsu/seed-session.ts <session_slug> [--yes]\n" +
        `  会期: ${SUPPORTED_SLUGS.join(", ")}`
    );
    process.exit(1);
  }

  if (!SUPPORTED_SLUGS.includes(slug)) {
    console.error(
      `対応していない会期です: ${slug}\n  使えるのは: ${SUPPORTED_SLUGS.join(", ")}`
    );
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? "(不明)";
  const isProduction = !supabaseUrl.includes("127.0.0.1");

  const supabase = createAdminClient();
  const sessionId = await findSessionId(supabase, slug);
  if (!sessionId) {
    console.error(
      `会期 "${slug}" が council_sessions にありません。\n` +
        "会期の追加は pnpm seed（全体の入れ直し）で行ってください。"
    );
    process.exit(1);
  }

  const existing = await countExisting(supabase, sessionId);

  console.log("─".repeat(60));
  console.log(`接続先 : ${supabaseUrl}${isProduction ? "  ⚠️ 本番" : "（ローカル）"}`);
  console.log(`会期   : ${slug}`);
  console.log(`入替前 : 議案${existing.bills}件 / 一般質問${existing.questions}件`);
  console.log("─".repeat(60));

  if (!confirmed) {
    console.log(
      "確認のみで終了しました。実行するには --yes を付けてください。\n" +
        "（この会期の議案・一般質問をいったん削除してから入れ直します）"
    );
    return;
  }

  console.log("🧹 この会期のデータを削除します...");
  await deleteSessionData(supabase, sessionId, slug);

  console.log("🌱 入れ直します...");
  await insertSessionData(supabase, sessionId, slug);

  const after = await countExisting(supabase, sessionId);
  console.log("─".repeat(60));
  console.log(`入替後 : 議案${after.bills}件 / 一般質問${after.questions}件`);

  // 入れ替え後に減っていたら、データの作り直し漏れを疑う
  if (after.bills < existing.bills || after.questions < existing.questions) {
    console.error(
      "❌ 入れ替え後に件数が減っています。データが欠けていないか確認してください。"
    );
    process.exit(1);
  }
  console.log("✅ 完了しました");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
