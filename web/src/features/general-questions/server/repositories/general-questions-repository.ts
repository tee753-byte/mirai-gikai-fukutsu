import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { GeneralQuestion } from "../../shared/types";
import type { GeneralQuestionWithSession } from "../../shared/utils/build-questioner-groups";

/** 質問1件と、それが行われた定例会の名前 */
export type GeneralQuestionWithSessionName = GeneralQuestion & {
  session_name: string | null;
  session_slug: string | null;
};

/**
 * 公開済みの一般質問を、定例会の情報つきで全件取得する。
 * 議員別ページで、1人の議員の質問を定例会をまたいで並べるために使う。
 */
export async function findAllPublishedGeneralQuestions(): Promise<
  GeneralQuestionWithSession[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select("*, council_sessions(name, slug, start_date)")
    .eq("publish_status", "published")
    .order("question_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch general questions: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const { council_sessions, ...question } = row as typeof row & {
      council_sessions: {
        name: string;
        slug: string | null;
        start_date: string | null;
      } | null;
    };
    return {
      ...question,
      topics: Array.isArray(question.topics) ? question.topics : [],
      session_name: council_sessions?.name ?? "",
      session_slug: council_sessions?.slug ?? null,
      session_start_date: council_sessions?.start_date ?? null,
    };
  }) as GeneralQuestionWithSession[];
}

export async function findPublishedGeneralQuestionsBySession(
  sessionId: string
): Promise<GeneralQuestion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select("*")
    .eq("council_session_id", sessionId)
    .eq("publish_status", "published")
    .order("session_day", { ascending: true })
    .order("question_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch general questions: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    ...row,
    topics: Array.isArray(row.topics) ? row.topics : [],
  })) as GeneralQuestion[];
}

export async function findLatestSessionSlugWithPublishedQuestions(): Promise<
  string | null
> {
  const supabase = createAdminClient();

  const { data: rows, error: qErr } = await supabase
    .from("general_questions")
    .select("council_session_id")
    .eq("publish_status", "published");

  if (qErr || !rows?.length) return null;

  const ids = [
    ...new Set(
      rows.map((r: { council_session_id: string }) => r.council_session_id)
    ),
  ];

  const { data: session, error: sErr } = await supabase
    .from("council_sessions")
    .select("slug")
    .in("id", ids)
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (sErr) return null;
  return session?.slug ?? null;
}

/**
 * 質問1件を取得する。
 *
 * 定例会名を一緒に取るのは、同じ議員が複数の定例会で質問しているため。
 * 定例会が分からないと、ページの見出しもブラウザのタブも検索結果も
 * 「○○議員の一般質問」が並ぶだけで、どれがどれか区別できない。
 */
export async function findPublishedGeneralQuestionById(
  id: string
): Promise<GeneralQuestionWithSessionName | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select("*, council_sessions(name, slug)")
    .eq("id", id)
    .eq("publish_status", "published")
    .single();

  if (error) {
    // PGRST116: 該当行なし / 22P02: idがuuid形式でない（不正なURL直打ち等）
    // どちらも「見つからない」として扱い、呼び出し元でnotFound()にする
    if (error.code === "PGRST116" || error.code === "22P02") return null;
    throw new Error(`Failed to fetch general question: ${error.message}`);
  }

  const { council_sessions, ...question } = data as typeof data & {
    council_sessions: { name: string; slug: string | null } | null;
  };

  return {
    ...question,
    topics: Array.isArray(question.topics) ? question.topics : [],
    session_name: council_sessions?.name ?? null,
    session_slug: council_sessions?.slug ?? null,
  } as GeneralQuestionWithSessionName;
}
