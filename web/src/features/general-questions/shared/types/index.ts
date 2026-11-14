/** ダイジェスト表示の1発言 */
export type TopicTurn = {
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
export type TopicExchange = {
  /** 論点の見出し。例「災害復旧20億円の財源」 */
  point: string;
  turns: TopicTurn[];
};

export type GeneralQuestionTopic = {
  title: string;
  question_summary: string;
  answer_summary: string;
  answerer_role: string;
  answerer_name: string;
  /**
   * 更質問まで含めたやり取りのダイジェスト。
   * 会議録が公開されていない定例会や、まだ作成していない議員では持たない。
   */
  exchanges?: TopicExchange[];
};

/**
 * 質問種別。
 * general … 一般質問（既定値）
 * sokatsu_shitsugi … 総括質疑（3月定例会に会派代表が行う、市長の施政方針・予算編成に対する質疑）
 */
export type QuestionType = "general" | "sokatsu_shitsugi";

/**
 * レコードの種別。
 * question         … 通常の質問（要旨・トピックあり、記事として掲載する）
 * attendance_only  … 定例会ごとの登壇状況（星取表）のためだけの記録。
 *                     要旨・トピックを持たず、記事としては出さない
 *                     （議案データが無い令和5〜7年の一部の定例会が対象）
 */
export type RecordKind = "question" | "attendance_only";

export type GeneralQuestion = {
  id: string;
  council_session_id: string;
  questioner_name: string;
  questioner_party: string | null;
  questioner_number: number | null;
  session_day: number;
  question_order: number;
  question_type: QuestionType;
  summary: string | null;
  topics: GeneralQuestionTopic[];
  raw_text: string | null;
  source_url: string | null;
  /** 録画（gikaifukutsu.org）へのリンク。会議録の公開前でも案内できる */
  video_url: string | null;
  record_kind: RecordKind;
  publish_status: string;
  created_at: string;
  updated_at: string;
};
