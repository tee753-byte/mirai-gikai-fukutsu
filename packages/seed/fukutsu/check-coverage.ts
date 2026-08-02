/**
 * 会議録に記録されているものが、サイトに載る手前のデータに全部入っているかを確かめる。
 *
 * 【なぜ要るか】
 * 議案・一般質問のデータは、人が読むために書かれた会議録を正規表現で削って作っている。
 * 議会の文書は毎回わずかに書き方が変わるので、書式の揺れでそこだけ静かに落ちる。
 * 落ちてもビルドは成功し、テストは通り、サイトも正常に見えるため、
 * 「載っていないこと」自体はどこにも現れない。
 *
 * 実際に、令和8年2月臨時会の承認第1号（衆院選の費用に関する専決処分の承認）が
 * まるごと欠けたまま気づかれずにいた。件名の末尾に括弧が付いて
 * 「について」と「は」が離れただけで、抽出の正規表現から外れていた。
 *
 * 【考え方】
 * 厳密に抽出したもの（サイトに載るデータ）と、ゆるく数えたもの（会議録に
 * 出てくるものすべて）を突き合わせる。ゆるいほうにしか無いものが取りこぼし。
 * ゆるいほうは書式の揺れに強い代わりに、これだけでは中身が作れない。
 */

import { parseMinutes, splitGeneralQuestions } from "./parse-minutes";

/** 議決された案件の種別。報告は議決の対象ではないので数えない */
const DECIDED_KIND = "議案|発議|同意|諮問|承認|認定|請願";

/**
 * 議長が議決を告げる文から、案件の番号だけをゆるく拾う。
 *
 * 件名の書き方（括弧の有無、「については」か「は、」か）に依存しないよう、
 * 「したがいまして」から句点までの間に出てくる案件番号を数えるだけにする。
 */
const DECISION_SENTENCE_RE = new RegExp(
  `(?:したがいまして|よって)([^。]*?(?:${DECIDED_KIND})第[0-9０-９]+号[^。]*?)。`,
  "g"
);
const ITEM_NUMBER_RE = new RegExp(`(${DECIDED_KIND})第([0-9０-９]+)号`, "g");

const FULL_WIDTH_DIGITS = "０１２３４５６７８９";

function toHalfWidth(text: string): string {
  return text.replace(/[０-９]/g, (c) => String(FULL_WIDTH_DIGITS.indexOf(c)));
}

/**
 * 会議録1日分から、議決された案件の番号をすべて拾う。
 *
 * 1つの文に複数の案件が出ることがある
 * （「議案第4号から議案第8号までは、原案のとおり可決…」）ので、
 * 文の中に現れる番号をすべて数える。
 */
export function collectDecidedItems(minutesText: string): Set<string> {
  const found = new Set<string>();

  DECISION_SENTENCE_RE.lastIndex = 0;
  let sentence: RegExpExecArray | null;
  while ((sentence = DECISION_SENTENCE_RE.exec(minutesText)) !== null) {
    ITEM_NUMBER_RE.lastIndex = 0;
    let item: RegExpExecArray | null;
    while ((item = ITEM_NUMBER_RE.exec(sentence[1])) !== null) {
      found.add(`${item[1]}第${toHalfWidth(item[2])}号`);
    }
  }

  return found;
}

/** 会議録1日分から、一般質問に立った議員の氏名を拾う */
export function collectQuestioners(minutesText: string): Set<string> {
  return new Set(
    splitGeneralQuestions(parseMinutes(minutesText)).map(
      (section) => section.questionerName
    )
  );
}

export type CoverageGap = {
  /** "議案" または "一般質問" */
  kind: string;
  /** 会議録にあるのにデータに無いもの */
  missing: string[];
};

export type CoverageResult = {
  /** 会議録から数えた議決の件数 */
  decidedCount: number;
  /** 会議録から数えた一般質問に立った議員の人数 */
  questionerCount: number;
  /** 取りこぼし。空なら問題なし */
  gaps: CoverageGap[];
};

/**
 * 会議録にあってデータに無いものを返す。空なら取りこぼしなし。
 *
 * 逆（データにあって会議録に無い）は取りこぼしではない。議案書や議決結果一覧など、
 * 会議録以外の資料から載せているものがあるため。
 */
export function findCoverageGaps(input: {
  /** 会議録テキスト（会期の全日分） */
  minutes: string[];
  /** データに入っている議案番号 */
  seededBillNumbers: string[];
  /** データに入っている一般質問の質問者名 */
  seededQuestioners: string[];
}): CoverageResult {
  const decided = new Set<string>();
  const questioners = new Set<string>();
  for (const text of input.minutes) {
    for (const item of collectDecidedItems(text)) decided.add(item);
    for (const name of collectQuestioners(text)) questioners.add(name);
  }

  const seededBills = new Set(input.seededBillNumbers);
  const seededQuestioners = new Set(
    input.seededQuestioners.map((n) => n.replace(/[\s　]/g, ""))
  );

  const gaps: CoverageGap[] = [];

  const missingBills = [...decided].filter((n) => !seededBills.has(n));
  if (missingBills.length > 0) {
    gaps.push({ kind: "議案", missing: missingBills });
  }

  const missingQuestioners = [...questioners].filter(
    (n) => !seededQuestioners.has(n.replace(/[\s　]/g, ""))
  );
  if (missingQuestioners.length > 0) {
    gaps.push({ kind: "一般質問", missing: missingQuestioners });
  }

  return {
    decidedCount: decided.size,
    questionerCount: questioners.size,
    gaps,
  };
}
