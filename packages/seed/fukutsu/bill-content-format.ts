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
 *   ## なぜ出されたのか            … やさしい版のみ・理由をやさしく書き直したもの
 *   ## 議案書に記載された理由      … くわしい版のみ・資料があるとき
 *   ## 市が議会で説明した提案理由  … くわしい版のみ・会議録があるとき
 *                                    （発議は「提出した議員が議会で説明した提案理由」）
 *   ## 委員会での審査              … くわしい版のみ・委員長報告があるとき
 *   ## 正式な件名                  … くわしい版のみ
 *   ## 元の資料                    … 出典リンク
 *   ## この記事の情報について      … AI要約である旨と、まだ載せられていないもの
 *
 * 【なぜ「なぜ出されたのか」がやさしい版に要るのか】
 * 理由・提案理由・委員長報告はどれもくわしい版にしか無かった。そのため
 * やさしい版の読者には、理由が難しく書かれているのではなく、理由が存在すること
 * 自体が見えていなかった。切り替えスイッチが「表現の難しさ」ではなく
 * 「情報の有無」を切り替えてしまっている状態だったため、やさしい版にも
 * 同じ内容を平易な言葉で置き、原文はくわしい版で読めることを案内する。
 *
 * ヘッダーの要約と役割が重ならないようにする。
 *   ヘッダーの要約   … 何の議案か
 *   なぜ出されたのか … なぜ必要とされたのか／それを誰が説明しているのか
 *
 * 【議決の結果を本文に書かない理由】
 * 以前は「## この議案はどうなったか」として議決結果の一文を置いていたが、
 * 本文のすぐ上にある審議のステータスカードが同じ一文をそのまま表示している。
 * 上部の要約を繰り返さないのと同じ理由で、これも本文には書かない。
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
  /**
   * 「なぜ出されたのか」に載せる、やさしく書き直した理由。
   * 議案書の理由と提案理由説明をもとにAIが書いたもので、原文ではない。
   * 予算議案のように理由がそもそも記録されていないものは undefined にする。
   */
  reasonPlain?: string | null;
  /**
   * 議員が提出した議案（発議）か。
   * 提案理由を説明したのが市なのか議員なのかで見出しの主語が変わる。
   * 発議なのに「市が説明した」と書くと、提出者の主張を市の説明として
   * 読ませてしまうため、ここは必ず区別する。
   */
  isMemberBill?: boolean;
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

/** 提案理由を説明したのは誰か。市の議案と発議で主語が変わる */
function proposalReasonSpeaker(input: BillContentInput): string {
  return input.isMemberBill ? "提出した議員" : "市";
}

/**
 * やさしい版の「なぜ出されたのか」。
 *
 * 原文はくわしい版にしか置いていないので、要約で済ませずに
 * 「原文はどこで読めるのか」まで書く。要約だけを唯一の情報源にしない。
 */
function reasonSection(input: BillContentInput): string | null {
  if (!input.reasonPlain) return null;

  // くわしい版の見出しと同じ言い方で案内する。読み手が探せるようにするため
  const originals: string[] = [];
  if (input.documentReason) originals.push("議案書に記載された理由");
  if (input.proposalReason) {
    originals.push(`${proposalReasonSpeaker(input)}が議会で説明した提案理由`);
  }

  const guide =
    originals.length > 0
      ? `\n\n${originals.join("と、")}の原文は、「説明をもっと詳しく」に切り替えると読めます。`
      : "";

  return `## なぜ出されたのか\n\n${input.reasonPlain}${guide}`;
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
  const parts: string[] = [];

  const reason = reasonSection(input);
  if (reason) parts.push(reason);

  const sources = sourcesSection(input.sources);
  if (sources) parts.push(sources);

  parts.push(infoSection(input));

  return parts.join("\n\n");
}

/** くわしい説明。どの資料からの引用かを必ず明示する */
export function buildHardContent(input: BillContentInput): string {
  const parts: string[] = [];

  // 議案書の理由と、本会議で読み上げられた提案理由説明は別物なので両方載せる。
  // 議案書のほうが正式な文章なので先に置く。
  if (input.documentReason) {
    parts.push(
      `## 議案書に記載された理由\n\n以下は議案書からの引用です。\n\n${asQuote(input.documentReason)}`
    );
  }
  if (input.proposalReason) {
    parts.push(
      `## ${proposalReasonSpeaker(input)}が議会で説明した提案理由\n\n以下は会議録からの引用です。\n\n${asQuote(input.proposalReason)}`
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
