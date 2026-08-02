import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findAllPublishedGeneralQuestions } from "../repositories/general-questions-repository";

/** 一般質問を掲載している定例会1つ分 */
export type SessionWithQuestions = {
  slug: string;
  name: string;
  startDate: string | null;
  /** 掲載している質問の件数 */
  questionCount: number;
  /** そのうち、会議録のやり取りまで載せられている件数 */
  transcriptCount: number;
};

/**
 * 一般質問を掲載している定例会を新しい順に返す。
 *
 * 会議録の公開は定例会の3か月ほど後になるため、開催直後の定例会は
 * 質問の項目だけが並び、中身が無いように見えてしまう。
 * 「他の定例会にはやり取りまで載っている」と示すために、
 * 定例会ごとの件数と、会議録が載っている件数の両方を数えておく。
 */
export async function getSessionsWithQuestions(): Promise<
  SessionWithQuestions[]
> {
  return _getCached();
}

const _getCached = unstable_cache(
  async (): Promise<SessionWithQuestions[]> => {
    const questions = await findAllPublishedGeneralQuestions();

    const bySlug = new Map<string, SessionWithQuestions>();
    for (const q of questions) {
      // 会期ページへのリンクに使うので、slugが無いものは並べられない
      if (!q.session_slug) continue;

      const existing = bySlug.get(q.session_slug);
      if (existing) {
        existing.questionCount += 1;
        if (q.raw_text) existing.transcriptCount += 1;
        continue;
      }
      bySlug.set(q.session_slug, {
        slug: q.session_slug,
        name: q.session_name,
        startDate: q.session_start_date,
        questionCount: 1,
        transcriptCount: q.raw_text ? 1 : 0,
      });
    }

    return [...bySlug.values()].sort((a, b) =>
      (b.startDate ?? "").localeCompare(a.startDate ?? "")
    );
  },
  ["sessions-with-questions"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.GENERAL_QUESTIONS],
  }
);
