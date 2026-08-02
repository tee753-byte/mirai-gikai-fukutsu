/**
 * 議案・請願の本文（bill_contents.content）を組み立てる共通処理。
 *
 * 【なぜ共通化したか】
 * 会期ごとに別々の関数で本文を作っていたため、開く議案によってページの構成が
 * 変わっていた。さらに、どの会期も本文の先頭で上部の要約をそのまま繰り返して
 * おり、市民は同じ説明を2回読まされていた（79議案中68件）。
 *
 * 上部の要約はページに必ず表示されるので、本文は「要約に書いていないこと」から
 * 始める。どの議案を開いても同じ順序で読めるようにする。
 *
 *   ## この議案はどうなったか      … 議決の結果
 *   ## 議案書に記載された理由      … くわしい版のみ・資料があるとき
 *   ## 市が議会で説明した提案理由  … くわしい版のみ・会議録があるとき
 *   ## 委員会での審査              … くわしい版のみ・委員長報告があるとき
 *   ## 正式な件名                  … くわしい版のみ
 *   ## 元の資料                    … 出典リンク
 *   ## この記事の情報について      … AI要約である旨と、まだ載せられていないもの
 */

export type BillContentSource = {
  label: string;
  url: string;
};

export type BillContentInput = {
  /** 「議案」または「請願」。見出しの言い回しに使う */
  subject: string;
  /** 議案書どおりの正式な件名 */
  billName: string;
  /** 「令和8年6月23日の本会議で否決」などの一文 */
  statusNote: string;
  /** 議案書に印刷された理由の原文 */
  documentReason?: string | null;
  /** 本会議で読み上げられた提案理由説明（会議録） */
  proposalReason?: string | null;
  /** 委員長報告（会議録） */
  committeeReport?: string | null;
  /** 元の資料へのリンク。市が公開しているものだけを載せる */
  sources: BillContentSource[];
  /** 会議録が公開済みか。未公開なら質疑・討論をまだ載せられない */
  hasMinutes: boolean;
  /** 議員別の賛否を載せられているか。市議会だよりの公開待ちなら false */
  hasMemberVotes: boolean;
  /** 会議録の公開見込み。例:「令和8年9月ごろ」。分からなければ null */
  minutesDueLabel?: string | null;
  /** AI要約の注記に書く「もとにした資料」。例:「会議録に記録された市の説明」 */
  aiSourceLabel: string;
  /** 請願書・議案書そのものを再掲載していない理由の一文 */
  originalDocumentNote: string;
};

/** 引用として表示するための記法。改行のある文章でも引用ブロックが途切れないようにする */
export function asQuote(text: string): string {
  return `> ${text.replace(/\n/g, "\n> ")}`;
}

function sourcesSection(sources: BillContentSource[]): string | null {
  if (sources.length === 0) return null;
  const list = sources.map((s) => `- [${s.label}](${s.url})`).join("\n");
  return `## 元の資料\n\n${list}`;
}

/**
 * 記事の成り立ちと、まだ載せられていないものの説明。
 *
 * 掲載が段階的に増えることを書いておかないと、情報が欠けているのか
 * そもそも存在しないのかが読み手に区別できない。
 */
function infoSection(input: BillContentInput): string {
  const lines = [
    `やさしい言葉での説明は、${input.aiSourceLabel}をもとにAIが書き直したものです。`,
  ];

  if (!input.hasMinutes) {
    const due = input.minutesDueLabel
      ? `（${input.minutesDueLabel}の見込み）`
      : "";
    lines.push(
      `本会議での質疑や討論の内容は、会議録の公開後${due}に追加します。`
    );
  }

  if (!input.hasMemberVotes) {
    // 市が公開する議決結果の資料には可決・否決しか載らない。
    // 誰が賛成したかは市議会だよりの賛否一覧表を待つしかない。
    lines.push(
      "どの議員が賛成・反対したかは、市議会だよりの賛否一覧表が公開されてから掲載します。市が公開している議決結果の資料には、可決・否決の別しか記載されていないためです。"
    );
  }

  return `## この記事の情報について\n\n${lines.join("\n\n")}`;
}

/** やさしい説明。上部の要約に続けて読む前提なので、説明を繰り返さない */
export function buildNormalContent(input: BillContentInput): string {
  const parts: string[] = [
    `## この${input.subject}はどうなったか\n\n${input.statusNote}`,
  ];

  const sources = sourcesSection(input.sources);
  if (sources) parts.push(sources);

  parts.push(infoSection(input));

  return parts.join("\n\n");
}

/** くわしい説明。どの資料からの引用かを必ず明示する */
export function buildHardContent(input: BillContentInput): string {
  const parts: string[] = [
    `## この${input.subject}はどうなったか\n\n${input.statusNote}`,
  ];

  // 議案書の理由と、本会議で読み上げられた提案理由説明は別物なので両方載せる。
  // 議案書のほうが正式な文章なので先に置く。
  if (input.documentReason) {
    parts.push(
      `## 議案書に記載された理由\n\n以下は議案書からの引用です。\n\n${asQuote(input.documentReason)}`
    );
  }
  if (input.proposalReason) {
    parts.push(
      `## 市が議会で説明した提案理由\n\n以下は会議録からの引用です。\n\n${asQuote(input.proposalReason)}`
    );
  }
  if (input.committeeReport) {
    parts.push(
      `## 委員会での審査\n\n以下は委員長報告の会議録からの引用です。\n\n${asQuote(input.committeeReport)}`
    );
  }

  parts.push(
    `## 正式な件名\n\n${input.billName}\n\n${input.originalDocumentNote}`
  );

  const sources = sourcesSection(input.sources);
  if (sources) parts.push(sources);

  parts.push(infoSection(input));

  return parts.join("\n\n");
}
