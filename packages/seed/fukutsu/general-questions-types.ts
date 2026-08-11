/**
 * 一般質問シードデータの型定義（福津市版）
 *
 * 定例会ごとにデータファイルを分けているため、型はここに集約する。
 * - general-questions-r8-6.ts … 令和8年6月定例会（質問のみ・答弁は議事録公開待ち）
 * - general-questions-r8-3.ts … 令和8年3月定例会（質問＋答弁）
 */

/** ダイジェスト表示の1発言 */
export type SeedTopicTurn = {
  side: "questioner" | "answerer";
  /** 答弁者の役職（例: "市長"）。議員の発言では持たない */
  role?: string;
  /** 答弁者の氏名。議員の発言では持たない */
  name?: string;
  /** 1〜3文に圧縮した発言 */
  text: string;
};

/**
 * 論点ひとつぶんのやり取り。
 * 質問 → 答弁 → 更質問 → 再答弁 の順に turns が並ぶ。
 */
export type SeedTopicExchange = {
  /** 論点の見出し。例「災害復旧20億円の財源」 */
  point: string;
  turns: SeedTopicTurn[];
};

export type SeedTopic = {
  /** 質問事項（大項目）の見出し */
  title: string;
  /** 議員が通告した質問要旨 */
  question_summary: string;
  /** 市側の第一答弁の要約。議事録が未公開の間は空文字 */
  answer_summary: string;
  /** 答弁者の役職（例: "市長", "教育長"）。未回答の間は空文字 */
  answerer_role: string;
  /** 答弁者の氏名。未回答の間は空文字 */
  answerer_name: string;
  /**
   * 更質問まで含めたやり取りのダイジェスト。
   * general-questions-digest-*.ts から merge-digest.ts で流し込む。
   */
  exchanges?: SeedTopicExchange[];
};

export type SeedGeneralQuestion = {
  questioner_name: string;
  questioner_party: string;
  /** 定例会全体を通した質問順 */
  question_order: number;
  /**
   * 一般質問・総括質疑が行われた日が定例会の何日目か（その質問種別の実施日を1から数える）。
   * 出典に実施日の記載がない場合は省略でき、投入時に 1 として扱う。
   * 総括質疑は一般質問と実施日が別なので、(council_session_id, session_day, question_order)
   * の一意制約に一般質問の値とぶつからないよう、専用の連番（0始まり）を使う。
   */
  session_day?: number;
  /** 省略時は一般質問（"general"）として扱う */
  question_type?: "general" | "sokatsu_shitsugi";
  summary: string;
  topics: SeedTopic[];
};

/**
 * 会議録から機械的に取り出した、1議員分の一般質問のやり取り全文。
 * build-transcripts.ts が生成する JSON の1件に対応する。
 */
export type SeedTranscript = {
  /** 全角スペースを除いた氏名 */
  questioner_name: string;
  questioner_number: string;
  source_file: string;
  raw_text: string;
};

/** 1つの定例会分の一般質問 */
export type SeedSessionQuestions = {
  /** data.ts の councilSessions の slug と一致させること */
  session_slug: string;
  /** 出典URL。全ての質問に同じものを設定する */
  source_url: string;
  questions: SeedGeneralQuestion[];
  /**
   * 議員ごとのやり取り全文（更質問を含む）。
   * 要約だけでは議員がその場で何を追及したかが伝わらないため、
   * 会議録の発言をそのまま載せる。議事録が未公開の定例会では空にする。
   */
  transcripts?: SeedTranscript[];
};
