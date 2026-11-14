import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { GeneralQuestionWithSession } from "../../shared/utils/build-questioner-groups";
import {
  findAllPublishedGeneralQuestions,
  findAllQuestionRecordsForAttendance,
} from "../repositories/general-questions-repository";

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

/** GeneralQuestionWithSession[] を定例会単位に集計する共通処理 */
function toSessionsWithQuestions(
  questions: GeneralQuestionWithSession[]
): SessionWithQuestions[] {
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
}

/**
 * 一般質問を掲載している定例会を新しい順に返す。
 *
 * 会議録の公開は定例会の3か月ほど後になるため、開催直後の定例会は
 * 質問の項目だけが並び、中身が無いように見えてしまう。
 * 「他の定例会にはやり取りまで載っている」と示すために、
 * 定例会ごとの件数と、会議録が載っている件数の両方を数えておく。
 *
 * 星取表専用の軽いレコード（record_kind = 'attendance_only'）は含まない。
 * その定例会には記事として見せられる質問が無いため、定例会一覧の切り替えに
 * 出しても遷移先が空になってしまう。星取表の列には getSessionsWithAttendanceRecords
 * を使う。
 */
export async function getSessionsWithQuestions(): Promise<
  SessionWithQuestions[]
> {
  return _getCached();
}

const _getCached = unstable_cache(
  async (): Promise<SessionWithQuestions[]> =>
    toSessionsWithQuestions(await findAllPublishedGeneralQuestions()),
  ["sessions-with-questions"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.GENERAL_QUESTIONS],
  }
);

/**
 * 一般質問・総括質疑「または」星取表専用の登壇記録がある定例会を新しい順に返す。
 *
 * 星取表の列は「議案データが無く記事は載せていないが、登壇したことは
 * 分かっている」定例会も含めて並べる必要があるため、getSessionsWithQuestions
 * とは別に用意する。
 */
export async function getSessionsWithAttendanceRecords(): Promise<
  SessionWithQuestions[]
> {
  return _getAttendanceCached();
}

const _getAttendanceCached = unstable_cache(
  async (): Promise<SessionWithQuestions[]> =>
    toSessionsWithQuestions(await findAllQuestionRecordsForAttendance()),
  ["sessions-with-attendance-records"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.GENERAL_QUESTIONS],
  }
);
