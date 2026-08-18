import type { GeneralQuestion, QuestionType } from "../types";

/** 1つの定例会での、その議員の一般質問・総括質疑 */
export type QuestionerSessionEntry = {
  questionId: string;
  sessionName: string;
  sessionSlug: string | null;
  /** 定例会の開始日。新しい順に並べるために使う */
  sessionStartDate: string | null;
  questionType: QuestionType;
  summary: string | null;
  /**
   * このデータを最後に更新した日時。
   * サイトマップの lastmod（検索エンジンに「いつ更新したか」を伝える値）に使う。
   * 定例会の開催日ではなく更新日時なので、後から議事録を足した場合も新しくなる。
   */
  updatedAt: string;
  /** 質問事項（大項目）の見出し */
  topicTitles: string[];
  /** やり取り全文が掲載されているか（議事録が未公開の定例会では false） */
  hasTranscript: boolean;
};

/** 議員1人分。複数の定例会にまたがる */
export type QuestionerGroup = {
  /** URL に使う識別子。氏名から空白を除いたもの */
  slug: string;
  name: string;
  /** 会派。定例会をまたいで変わることがあるため、最新のものを採る */
  party: string | null;
  entries: QuestionerSessionEntry[];
};

/**
 * 議員名から URL 用の識別子をつくる。
 *
 * 福津市議会には議員マスタのテーブルがなく、`general_questions.questioner_name`
 * のテキストしか手がかりがない。会議録は「山本祐平」、一般質問PDFは「山本 祐平」と
 * 空白の有無が揺れるため、空白を除いた形をキーにして同一人物として扱う。
 */
export function toQuestionerSlug(name: string): string {
  return name.replace(/[\s　]/g, "");
}

/** 定例会つきの一般質問。開始日で並べ替えるためセッション情報を持たせる */
export type GeneralQuestionWithSession = GeneralQuestion & {
  session_name: string;
  session_slug: string | null;
  session_start_date: string | null;
};

/**
 * 一般質問を議員ごとにまとめる。
 *
 * 掲載基準は全議員で統一する（CLAUDE.md の中立性の要件）。
 * 並び順は氏名の五十音ではなく「掲載している定例会が新しい順 → 氏名順」とし、
 * 発言量や質問回数では並べ替えない。回数の多寡は扱った項目数に左右されるため、
 * 順位として見せると議員の評価を誤らせる。
 */
export function buildQuestionerGroups(
  questions: GeneralQuestionWithSession[]
): QuestionerGroup[] {
  const bySlug = new Map<string, QuestionerGroup>();
  // 会派を「最新のsession_start_date」で決めるための、slugごとの基準日。
  // 入力の並び順（question_orderは定例会をまたいだ時系列を保証しない）に依存しないようにする。
  const partyDecidedAt = new Map<string, string>();

  for (const q of questions) {
    const slug = toQuestionerSlug(q.questioner_name);
    const entry: QuestionerSessionEntry = {
      questionId: q.id,
      sessionName: q.session_name,
      sessionSlug: q.session_slug,
      sessionStartDate: q.session_start_date,
      questionType: q.question_type,
      summary: q.summary,
      updatedAt: q.updated_at,
      topicTitles: q.topics.map((t) => t.title),
      hasTranscript: Boolean(q.raw_text),
    };

    // 日付不明のレコードは、既に日付が分かっているレコードより新しいとは判断しない。
    const candidateDate = q.session_start_date ?? "";
    const existing = bySlug.get(slug);
    const isLatestForParty =
      !partyDecidedAt.has(slug) ||
      candidateDate > (partyDecidedAt.get(slug) ?? "");

    if (existing) {
      existing.entries.push(entry);
      if (isLatestForParty) {
        existing.party = q.questioner_party;
        partyDecidedAt.set(slug, candidateDate);
      }
    } else {
      bySlug.set(slug, {
        slug,
        name: q.questioner_name,
        party: q.questioner_party,
        entries: [entry],
      });
      partyDecidedAt.set(slug, candidateDate);
    }
  }

  const groups = [...bySlug.values()];

  for (const g of groups) {
    g.entries.sort((a, b) =>
      (b.sessionStartDate ?? "").localeCompare(a.sessionStartDate ?? "")
    );
  }

  groups.sort((a, b) => {
    const byDate = (b.entries[0]?.sessionStartDate ?? "").localeCompare(
      a.entries[0]?.sessionStartDate ?? ""
    );
    if (byDate !== 0) return byDate;
    return a.name.localeCompare(b.name, "ja");
  });

  return groups;
}
