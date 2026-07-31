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

export type GeneralQuestion = {
  id: string;
  council_session_id: string;
  questioner_name: string;
  questioner_party: string | null;
  questioner_number: number | null;
  session_day: number;
  question_order: number;
  summary: string | null;
  topics: GeneralQuestionTopic[];
  raw_text: string | null;
  source_url: string | null;
  publish_status: string;
  created_at: string;
  updated_at: string;
};
