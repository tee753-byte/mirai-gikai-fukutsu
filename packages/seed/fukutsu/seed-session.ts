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
 * 【新しい会期を初めて載せるとき】
 * council_sessions にその会期がまだ無ければ、main/data.ts の councilSessions の
 * 定義を使って会期の行から作る。新しい定例会を本番に載せる手段が pnpm seed
 * （全消しして入れ直す）しか無いと、公開後にサイト全体が一瞬空になるため。
 * main/data.ts に定義が無いときは、そこに追加してから実行する。
 */
import { councilSessions } from "../main/data";
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
import { seedMemberVotesR7_6 } from "./seed-member-votes-r7-6";
import { seedMemberVotesR7_9 } from "./seed-member-votes-r7-9";
import { seedMemberVotesR7_12 } from "./seed-member-votes-r7-12";
import {
  seedMemberVotesR8_4,
  seedMemberVotesR8_6,
} from "./seed-member-votes-r8-6";
import { FUKUTSU_SESSIONS } from "./sessions";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * 会期ごとの、議員別賛否の入れ方。**ここに載っていない会期には賛否を入れない。**
 *
 * 賛否の出どころは市議会だよりの賛否表で、号ごとに載っている会期が決まっている。
 * 対応表を持たない会期を既定の関数に流すと、議案番号が同じというだけで別会期の
 * 賛否が付いてしまうため、明示的に列挙する方式にしている。
 *
 * 新しい会期を追加するときは、その会期の賛否表が載った議会だよりが公開されてから
 * ここに1行足す（会議録より2か月ほど遅れて公開される）。
 */
const MEMBER_VOTES_SEEDERS: Record<
  string,
  ((supabase: AdminClient, sessionId: string) => Promise<number>) | undefined
> = {
  // 議会だより82号
  "r7-6": (supabase, sessionId) => seedMemberVotesR7_6(supabase, [sessionId]),
  // 議会だより83号
  "r7-9": (supabase, sessionId) => seedMemberVotesR7_9(supabase, [sessionId]),
  // 議会だより84号
  "r7-12": (supabase, sessionId) =>
    seedMemberVotesR7_12(supabase, [sessionId]),
  // 議会だより85号（1月臨時会・2月臨時会・3月定例会の3会期分）
  "r8-1": (supabase, sessionId) => seedMemberVotes(supabase, [sessionId]),
  "r8-2": (supabase, sessionId) => seedMemberVotes(supabase, [sessionId]),
  "r8-3": (supabase, sessionId) => seedMemberVotes(supabase, [sessionId]),
  // 議会だより86号（4月臨時会・6月定例会の2会期分）
  "r8-4": (supabase, sessionId) => seedMemberVotesR8_4(supabase, [sessionId]),
  "r8-6": (supabase, sessionId) => seedMemberVotesR8_6(supabase, [sessionId]),
};

/** 入れ替えの対象にできる会期。r8-3 だけは予算があり個別実装なので別扱い */
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

/**
 * council_sessions に会期の行を作る。
 *
 * このスクリプトは本来「既にある会期を入れ替える」ものだが、会期を作れないと
 * 新しい定例会を本番に載せる手段が pnpm seed（全消しして入れ直す）しかなくなる。
 * 公開後にそれを走らせるとサイト全体が一瞬空になるため、ここで作れるようにする。
 *
 * 定義は main/data.ts の councilSessions をそのまま使う。pnpm seed と
 * 同じ出どころにしておかないと、会期名や日付が経路によって食い違う。
 */
async function createSession(
  supabase: AdminClient,
  slug: string
): Promise<string> {
  const definition = councilSessions.find((s) => s.slug === slug);
  if (!definition) {
    throw new Error(
      `会期 "${slug}" の定義が main/data.ts の councilSessions にありません。`
    );
  }

  const { data, error } = await supabase
    .from("council_sessions")
    .insert(definition)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `会期の作成に失敗しました: ${error?.message ?? "行が返りませんでした"}`
    );
  }
  return data.id;
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
      sources: session.sources,
      hasMinutes: session.hasMinutes ?? true,
      hasMemberVotes: session.hasMemberVotes ?? true,
      decidedAt: session.decidedAt,
      submittedAt: session.submittedAt,
    });
  }

  // 議員別の賛否は市議会だよりの賛否表から作る。会期によって出どころが違う。
  //
  // 【重要】賛否表を持っていない会期では、絶対にどちらの関数も呼ばないこと。
  // seedMemberVotes は議会だより85号（r8-1・r8-2・r8-3の3会期）のデータを持ち、
  // 議案番号で対象のbillを探す。議案番号は会期ごとに振り直されるため、賛否表を
  // 持たない会期に対して呼ぶと、番号が同じというだけで無関係な議案に別の会期の
  // 賛否が結びついてしまう（例: 令和8年3月定例会の議案第33〜42号の賛否が、
  // 令和7年9月定例会の議案第33〜42号に付く）。市民に誤った賛否を見せることになる。
  const memberVotes = MEMBER_VOTES_SEEDERS[slug]
    ? await MEMBER_VOTES_SEEDERS[slug](supabase, sessionId)
    : 0;
  if (memberVotes > 0) {
    console.log(`✅ 議員別の賛否: ${memberVotes}件`);
  } else {
    console.log(
      "ℹ️  議員別の賛否: この会期の賛否表はまだ持っていないため投入しない"
    );
  }

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
  let sessionId = await findSessionId(supabase, slug);
  // 会期そのものがまだ無い＝新しい定例会を初めて載せる場合。
  // main/data.ts に定義があれば作れるので、ここでは止めない
  const isNewSession = sessionId === null;
  if (isNewSession && !councilSessions.some((s) => s.slug === slug)) {
    console.error(
      `会期 "${slug}" が council_sessions にも main/data.ts にもありません。\n` +
        "先に main/data.ts の councilSessions に会期を追加してください。"
    );
    process.exit(1);
  }

  const existing = sessionId
    ? await countExisting(supabase, sessionId)
    : { bills: 0, questions: 0 };

  console.log("─".repeat(60));
  console.log(`接続先 : ${supabaseUrl}${isProduction ? "  ⚠️ 本番" : "（ローカル）"}`);
  console.log(
    `会期   : ${slug}${isNewSession ? "  🆕 新規（会期から作ります）" : ""}`
  );
  console.log(`入替前 : 議案${existing.bills}件 / 一般質問${existing.questions}件`);
  console.log("─".repeat(60));

  if (!confirmed) {
    console.log(
      "確認のみで終了しました。実行するには --yes を付けてください。\n" +
        (isNewSession
          ? "（この会期を council_sessions に作ってから、議案・一般質問を入れます）"
          : "（この会期の議案・一般質問をいったん削除してから入れ直します）")
    );
    return;
  }

  if (isNewSession) {
    console.log("🆕 会期を作ります...");
    sessionId = await createSession(supabase, slug);
  } else {
    console.log("🧹 この会期のデータを削除します...");
    await deleteSessionData(supabase, sessionId as string, slug);
  }

  console.log("🌱 入れ直します...");
  await insertSessionData(supabase, sessionId as string, slug);

  const after = await countExisting(supabase, sessionId as string);
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
