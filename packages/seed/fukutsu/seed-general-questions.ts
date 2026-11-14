/**
 * 一般質問（general_questions）を会期ごとに投入する。
 *
 * run.ts の中に書いてあった処理を関数にした。全件を入れ直す run.ts と、
 * 1会期だけを入れ替える seed-session.ts の両方から呼ぶため。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { ATTENDANCE_RECORDINGS } from "./attendance-recordings-data";
import {
  generalQuestionsBySession,
  type SeedSessionQuestions,
} from "./general-questions-data";

// biome-ignore lint/suspicious/noExplicitAny: seedスクリプト内でのみ使う簡易クライアント型
type Client = SupabaseClient<any, "public", any>;

/**
 * 会議録は「山本祐平」、シードは「山本 祐平」と全角スペースの有無が違う。
 * 突き合わせは空白を除いた形で行う。
 */
function stripSpaces(name: string): string {
  return name.replace(/[\s　]/g, "");
}

/** 1会期ぶんの一般質問を投入し、入れた件数を返す */
export async function seedGeneralQuestionsForSession(
  supabase: Client,
  councilSessionId: string,
  session: SeedSessionQuestions
): Promise<number> {
  const transcriptByName = new Map(
    (session.transcripts ?? []).map((t) => [stripSpaces(t.questioner_name), t])
  );

  // 録画（gikaifukutsu.org）へのリンク。会議録の公開前でも案内できるように添える。
  // 出典は attendance-recordings-data.ts（[[fukutsu-attendance-matrix]] と同じ調査）
  const recordingByName = new Map(
    (ATTENDANCE_RECORDINGS[session.session_slug] ?? []).map((r) => [
      stripSpaces(r.name),
      r.videoUrl,
    ])
  );

  const rows = session.questions.map((q) => ({
    council_session_id: councilSessionId,
    questioner_name: q.questioner_name,
    questioner_party: q.questioner_party,
    question_order: q.question_order,
    session_day: q.session_day ?? 1,
    question_type: q.question_type ?? "general",
    summary: q.summary,
    topics: q.topics,
    raw_text:
      transcriptByName.get(stripSpaces(q.questioner_name))?.raw_text ?? null,
    source_url: session.source_url,
    video_url:
      q.video_url ?? recordingByName.get(stripSpaces(q.questioner_name)) ?? null,
    publish_status: "published",
  }));

  // 突き合わせできなかったやり取りがあれば、氏名の表記ゆれを疑う
  const matched = rows.filter((r) => r.raw_text !== null).length;
  if (matched !== transcriptByName.size) {
    console.log(
      `⚠️ "${session.session_slug}": やり取り全文 ${transcriptByName.size} 件のうち ${matched} 件しか議員に紐づきませんでした。氏名の表記を確認してください。`
    );
  }

  if (rows.length === 0) return 0;

  const { data, error } = await supabase
    .from("general_questions")
    .insert(rows)
    .select("id");

  if (error) {
    throw new Error(
      `Failed to insert general questions for "${session.session_slug}": ${error.message}`
    );
  }

  return data?.length ?? 0;
}

/** 会期スラッグから、その会期の一般質問データを探す */
export function findGeneralQuestions(
  slug: string
): SeedSessionQuestions | undefined {
  return generalQuestionsBySession.find((s) => s.session_slug === slug);
}

/**
 * 星取表専用の登壇記録（record_kind = 'attendance_only'）を投入する。
 *
 * 議案データが無く記事化していない定例会（令和5年3月〜令和7年3月）向け。
 * 要旨・トピックを持たず「誰が・どの種別で登壇したか」だけを記録する。
 * 出典は attendance-recordings-data.ts（[[fukutsu-attendance-matrix]]）。
 */
export async function seedAttendanceOnlyRecordsForSession(
  supabase: Client,
  councilSessionId: string,
  sessionSlug: string
): Promise<number> {
  const recordings = ATTENDANCE_RECORDINGS[sessionSlug] ?? [];
  if (recordings.length === 0) return 0;

  const rows = recordings.map((r, i) => ({
    council_session_id: councilSessionId,
    questioner_name: r.name,
    questioner_party: null,
    question_order: i + 1,
    session_day: 1,
    question_type: r.qType,
    summary: null,
    topics: [],
    raw_text: null,
    source_url: null,
    video_url: r.videoUrl,
    record_kind: "attendance_only",
    publish_status: "published",
  }));

  const { data, error } = await supabase
    .from("general_questions")
    .insert(rows)
    .select("id");

  if (error) {
    throw new Error(
      `Failed to insert attendance-only records for "${sessionSlug}": ${error.message}`
    );
  }

  return data?.length ?? 0;
}
