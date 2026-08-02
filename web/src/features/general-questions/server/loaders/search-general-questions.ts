import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findAllPublishedGeneralQuestions } from "../repositories/general-questions-repository";

export type GeneralQuestionSearchFilters = {
  /** 検索キーワード。空文字なら絞り込まない */
  keyword: string;
  /** 会期のslug。"" ならすべて */
  sessionSlug: string;
};

/** 検索結果1件分 */
export type GeneralQuestionSearchHit = {
  id: string;
  questionerName: string;
  sessionName: string;
  sessionSlug: string | null;
  /** 質問事項（大項目）の見出し */
  topicTitles: string[];
  summary: string | null;
  /** やり取りの全文まで載っているか */
  hasTranscript: boolean;
  /**
   * キーワードが本文のどこに出てきたかの抜粋。
   * 見出しや要約に無くても本文には出てくることが多く、
   * なぜこの質問が引っかかったのかが分からないと不親切なため添える
   */
  excerpt: string | null;
};

export type GeneralQuestionSearchResult = {
  questions: GeneralQuestionSearchHit[];
  /** 絞り込み前の総件数 */
  totalCount: number;
};

/** 全角スペースでも区切れるようにする。複数語はAND条件 */
function toKeywords(keyword: string): string[] {
  return keyword
    .replace(/　/g, " ")
    .split(" ")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}

/**
 * キーワードの周辺だけを切り出す。
 * 会議録の全文は非常に長いため、そのまま出すと画面が埋まってしまう。
 */
function buildExcerpt(rawText: string, keyword: string): string | null {
  const index = rawText.toLowerCase().indexOf(keyword);
  if (index < 0) return null;

  const start = Math.max(0, index - 40);
  const end = Math.min(rawText.length, index + keyword.length + 60);
  const body = rawText.slice(start, end).replace(/\s+/g, " ").trim();

  return `${start > 0 ? "…" : ""}${body}${end < rawText.length ? "…" : ""}`;
}

/**
 * 公開済みの一般質問を検索する。
 *
 * 議案には出てこないが一般質問では議論されている話題が多い。
 * 「東福間」で調べると議案は0件だが一般質問は8件あり、議案だけを
 * 検索対象にしていると「議会で扱われていない」と誤解させてしまう。
 *
 * 会議録の全文（raw_text）も対象にする。市民が知りたい地名や施設名は
 * 質問の見出しではなく、やり取りの中で出てくることが多いため。
 *
 * 掲載件数が数十件のうちは全件を取得してからJavaScript側で絞り込む。
 * 件数が増えて重くなったら全文検索インデックスに切り替える。
 */
export async function searchGeneralQuestions(
  filters: GeneralQuestionSearchFilters
): Promise<GeneralQuestionSearchResult> {
  const all = await _getCached();
  const keywords = toKeywords(filters.keyword);

  const questions = all.filter((q) => {
    if (filters.sessionSlug && q.sessionSlug !== filters.sessionSlug) {
      return false;
    }
    if (keywords.length === 0) return true;
    return keywords.every((k) => q.haystack.includes(k));
  });

  return {
    questions: questions.map(({ haystack: _haystack, rawText, ...hit }) => ({
      ...hit,
      excerpt: keywords[0] ? buildExcerpt(rawText, keywords[0]) : null,
    })),
    totalCount: all.length,
  };
}

type IndexedQuestion = GeneralQuestionSearchHit & {
  /** 検索対象を1本の文字列にまとめたもの */
  haystack: string;
  /** 抜粋を作るための元テキスト */
  rawText: string;
};

const _getCached = unstable_cache(
  async (): Promise<IndexedQuestion[]> => {
    const questions = await findAllPublishedGeneralQuestions();

    return questions.map((q) => {
      const topicTitles = q.topics.map((t) => t.title);
      // 論点ごとの要約まで対象に含める。見出しに出ない言葉を拾うため
      const topicBodies = q.topics.flatMap((t) => [
        t.question_summary,
        t.answer_summary,
        ...(t.exchanges?.flatMap((e) => [
          e.point,
          ...e.turns.map((turn) => turn.text),
        ]) ?? []),
      ]);
      const rawText = q.raw_text ?? "";

      const haystack = [
        q.questioner_name,
        q.session_name,
        q.summary,
        ...topicTitles,
        ...topicBodies,
        rawText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return {
        id: q.id,
        questionerName: q.questioner_name,
        sessionName: q.session_name,
        sessionSlug: q.session_slug,
        topicTitles,
        summary: q.summary,
        hasTranscript: Boolean(q.raw_text),
        excerpt: null,
        haystack,
        rawText,
      };
    });
  },
  ["searchable-general-questions"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.GENERAL_QUESTIONS],
  }
);
