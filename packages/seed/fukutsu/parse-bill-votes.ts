/**
 * 福津市議会の会議録（テキスト）から、議案の議決結果と討論を取り出す。
 *
 * 前提となる会議録の書式:
 *   ○議長（…）　…      議事進行
 *   ◎N番（氏名）　…    議員の討論・提案理由説明
 *   ◆N番（氏名）　…    議員の質疑
 *
 * 【重要】福津市議会の採決はすべて起立採決で、会議録には
 *   〔起　　立〕 → 「賛成多数であります」
 * としか残らない。**どの議員が起立したかの氏名は記録されていない。**
 * したがって議員個人の賛否は本ファイルでは取得できず、
 * 名前が分かるのは討論（賛成討論・反対討論）を行った議員だけ。
 */

/** 採決のとり方。議員個人の賛否が分からないことを画面側で正しく説明するために持つ */
export type VoteMethod =
  | "majority" // 賛成多数
  | "minority" // 賛成少数（＝否決）
  | "chairDecision" // 可否同数で議長裁決
  | "noObjection"; // 異議なしで決定

/** 議決結果 */
export type VoteOutcome = "approved" | "rejected" | "agreed";

/** 討論での立場 */
export type DebateStance = "for" | "against";

export type Debate = {
  stance: DebateStance;
  speakerName: string;
  speakerNumber: string;
  rawText: string;
};

export type BillVote = {
  /** 例: "議案第33号" */
  billNumber: string;
  /** 例: "福津市下水道条例を改正することについて" */
  billName: string;
  outcome: VoteOutcome;
  voteMethod: VoteMethod;
  debates: Debate[];
  /** 何日目の会議録から取ったか（1始まり） */
  sessionDay: number;
};

const FULL_WIDTH_DIGITS = "０１２３４５６７８９";

/** 全角数字を半角に直す。会議録は「議案第９号」「発議第１号」のように全角が混ざる */
export function toHalfWidthDigits(text: string): string {
  return text.replace(/[０-９]/g, (c) =>
    String(FULL_WIDTH_DIGITS.indexOf(c))
  );
}

/** 「議案第33号福津市下水道条例を改正すること」を番号と件名に割る */
export function splitBillTitle(
  title: string
): { billNumber: string; billName: string } | null {
  const m = title.match(/^(議案|発議|同意|諮問)第([0-9０-９]+)号(.*)$/);
  if (!m) return null;

  const name = m[3].trim();
  return {
    billNumber: `${m[1]}第${toHalfWidthDigits(m[2])}号`,
    // 会議録は「…すること」で切れていることが多いので、議案名の形に整える
    billName: name.endsWith("について") ? name : `${name}について`,
  };
}

/**
 * 議長が結論を述べる文。ここを区切りにして議案ごとのかたまりに分ける。
 *   例1: 賛成多数であります。したがいまして、議案第17号…については、委員会の報告どおり可決することに決定いたしました。
 *   例2: 可否同数であります。…議案第33号…については否決されました。
 *   例3: ご異議なしと認めます。したがいまして、…については、…決定いたしました。
 */
// 「については、可決…」と「については可決…」の両方が出てくるので読点は任意にする
const MAJORITY_RE =
  /賛成(多数|少数)であります。したがいまして、(.+?)については、?(.+?)。/g;
const CHAIR_DECISION_RE =
  /議長は(可決|否決)と裁決します。したがいまして、日程第[0-9０-９]+、(.+?)については(可決|否決)されました。/g;

/**
 * 議長が討論の立場を指定する文。
 * 委員会の報告が否決だと「まず、委員会の報告は否決ですので、本案に賛成の議員の…」のように
 * 前置きが入るため、「の議員の発言を許します」の直前にある賛否を拾う。
 */
const DEBATE_PERMISSION_RE =
  /(?:まず|次に)、[^。]*?(反対|賛成)の議員の発言を許します。/g;

/** ◎N番（氏名）　本文 */
const MEMBER_SPEECH_RE = /◎([0-9０-９]+)番（(.+?)）[\s　]*([\s\S]*)/;

type Conclusion = {
  index: number;
  endIndex: number;
  title: string;
  outcome: VoteOutcome;
  voteMethod: VoteMethod;
};

function collectConclusions(text: string): Conclusion[] {
  const found: Conclusion[] = [];

  MAJORITY_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MAJORITY_RE.exec(text)) !== null) {
    const decision = m[3];
    found.push({
      index: m.index,
      endIndex: m.index + m[0].length,
      title: m[2],
      outcome: decision.includes("否決")
        ? "rejected"
        : decision.includes("同意") || decision.includes("適任")
          ? "agreed"
          : "approved",
      voteMethod: m[1] === "多数" ? "majority" : "minority",
    });
  }

  CHAIR_DECISION_RE.lastIndex = 0;
  while ((m = CHAIR_DECISION_RE.exec(text)) !== null) {
    found.push({
      index: m.index,
      endIndex: m.index + m[0].length,
      title: m[2],
      outcome: m[3] === "否決" ? "rejected" : "approved",
      voteMethod: "chairDecision",
    });
  }

  return found.sort((a, b) => a.index - b.index);
}

/**
 * 議案1件ぶんの本文から討論を取り出す。
 * 議長が「反対の議員の発言を許します」と言った直後の議員発言が反対討論、
 * 「賛成の議員の…」の直後が賛成討論、という並びになっている。
 */
export function extractDebates(block: string): Debate[] {
  DEBATE_PERMISSION_RE.lastIndex = 0;
  const permissions: { index: number; endIndex: number; stance: DebateStance }[] =
    [];
  let m: RegExpExecArray | null;
  while ((m = DEBATE_PERMISSION_RE.exec(block)) !== null) {
    permissions.push({
      index: m.index,
      endIndex: m.index + m[0].length,
      stance: m[1] === "賛成" ? "for" : "against",
    });
  }

  const debates: Debate[] = [];
  for (let i = 0; i < permissions.length; i++) {
    const from = permissions[i].endIndex;
    const to = permissions[i + 1]?.index ?? block.length;
    const segment = block.slice(from, to);

    // 〔「なし」の声あり〕だけで誰も発言しなかった場合は飛ばす
    if (!segment.includes("◎")) continue;

    // 討論の本文は、次に議長が発言するまで。
    // 立場を言い間違えて議長に制止され、言い直すことがあるため
    // （例: 令和8年3月定例会 議案第19号）、同じ区間で一番長い発言を採用する。
    const bodies = segment
      .split("○議長")
      .map((part) => {
        const start = part.indexOf("◎");
        return start === -1 ? "" : part.slice(start).trim();
      })
      .filter(Boolean);

    const body = bodies.reduce((a, b) => (b.length > a.length ? b : a), "");
    const parsed = body.match(MEMBER_SPEECH_RE);
    if (!parsed) continue;

    debates.push({
      stance: permissions[i].stance,
      speakerNumber: toHalfWidthDigits(parsed[1]),
      speakerName: parsed[2].replace(/[\s　]/g, ""),
      rawText: parsed[3].trim(),
    });
  }

  return debates;
}

/**
 * 会議録1日分から、議決された議案をすべて取り出す。
 * 人事案件（同意・諮問）は討論が省略されるため、呼び出し側で必要なら除外する。
 */
export function parseBillVotes(text: string, sessionDay: number): BillVote[] {
  const normalized = text.replace(/\r/g, "");
  const conclusions = collectConclusions(normalized);

  const votes: BillVote[] = [];
  for (let i = 0; i < conclusions.length; i++) {
    const c = conclusions[i];
    const split = splitBillTitle(c.title);
    if (!split) continue;

    // 直前の結論の終わりから今回の結論までが、この議案の審議部分
    const blockStart = i === 0 ? 0 : conclusions[i - 1].endIndex;
    const block = normalized.slice(blockStart, c.index);

    votes.push({
      billNumber: split.billNumber,
      billName: split.billName,
      outcome: c.outcome,
      voteMethod: c.voteMethod,
      debates: extractDebates(block),
      sessionDay,
    });
  }

  return votes;
}

/** 単独の見出し。「◯ページになります。議案第15号…についてです。」「…について。」 */
const REASON_HEADING_RE =
  /(議案|発議|同意|諮問)第([0-9０-９]+)号(?:.+?)について(?:です|でございます)?。/g;

/** 一括説明のあと、件名だけ読み上げる部分の目印。ここから先は説明ではない */
const ENUMERATION_MARKER = /(?:ページ番号、議案番号、議案名称についてのみ申し上げます。|については、?ページ番号)/;

/**
 * まとめて説明される見出し。
 * 「議案第19号から第24号につきましては、公共施設の使用料の改正に関する議案でございます。」
 */
const REASON_RANGE_HEADING_RE =
  /(議案|発議)第([0-9０-９]+)号から(?:議案)?第([0-9０-９]+)号(?:まで)?につきまし(?:ては|て)[、,]/g;

type ReasonHeading = {
  index: number;
  endIndex: number;
  billNumbers: string[];
};

/**
 * 説明文ではなく議案名の読み上げ（「50ページ、議案第19号…、54ページ、議案第20号…」）かどうか。
 * まとめて説明したあとに件名だけ列挙する箇所があり、これを説明文として拾うと中身が入れ替わる。
 */
function isEnumeration(body: string): boolean {
  const head = body.slice(0, 120);
  return (head.match(/(議案|発議)第[0-9０-９]+号/g) ?? []).length >= 2;
}

/**
 * 初日の「提案理由の説明」から、議案ごとの説明文を取り出す。
 * 市長が読み上げた見出しから、次の議案の見出しまでがその議案の説明にあたる。
 * 一括説明された議案は、同じ説明文を範囲内の全議案に割り当てる。
 */
export function extractProposalReasons(text: string): Map<string, string> {
  const normalized = text.replace(/\r/g, "");
  const headings: ReasonHeading[] = [];
  let m: RegExpExecArray | null;

  REASON_RANGE_HEADING_RE.lastIndex = 0;
  while ((m = REASON_RANGE_HEADING_RE.exec(normalized)) !== null) {
    const from = Number(toHalfWidthDigits(m[2]));
    const to = Number(toHalfWidthDigits(m[3]));
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) continue;

    const numbers: string[] = [];
    for (let n = from; n <= to; n++) numbers.push(`${m[1]}第${n}号`);
    headings.push({
      index: m.index,
      endIndex: m.index + m[0].length,
      billNumbers: numbers,
    });
  }

  REASON_HEADING_RE.lastIndex = 0;
  while ((m = REASON_HEADING_RE.exec(normalized)) !== null) {
    // 一括説明の見出しと重なる位置は、範囲側を優先する
    if (headings.some((h) => m!.index >= h.index && m!.index < h.endIndex)) {
      continue;
    }
    headings.push({
      index: m.index,
      endIndex: m.index + m[0].length,
      billNumbers: [`${m[1]}第${toHalfWidthDigits(m[2])}号`],
    });
  }

  headings.sort((a, b) => a.index - b.index);

  const reasons = new Map<string, string>();
  for (let i = 0; i < headings.length; i++) {
    const body = normalized
      .slice(headings[i].endIndex, headings[i + 1]?.index ?? normalized.length)
      // 議長の発言や次の議題に入ったらそこで切る
      .split(/○議長|△日程第|～～～～/)[0]
      // 「◯ページになります。」のような読み上げ位置の案内は要らない
      .replace(/[0-9０-９]+ページ(?:に)?なります。/g, "")
      .replace(/^[\s　]*(?:続いて|次に|続きまして)[、,]?/, "")
      // 一括説明のあとに件名だけ並ぶ部分は説明ではないので落とす
      .split(ENUMERATION_MARKER)[0]
      .trim();

    if (body.length < 20 || isEnumeration(body)) continue;

    for (const billNumber of headings[i].billNumbers) {
      // 同じ議案が複数回出てきたら、説明が一番厚いものを採る
      const prev = reasons.get(billNumber);
      if (!prev || body.length > prev.length) reasons.set(billNumber, body);
    }
  }

  return reasons;
}

export type Sponsor = {
  role: "proposer" | "seconder";
  memberName: string;
};

/**
 * 発議の提出者・賛成者を取り出す。
 * 提案理由の説明で「提出者、福津市議会議員山本祐平、賛成者、福津市議会議員石田まなみ。」
 * のように読み上げられる。会議録に氏名がそのまま残っている確実な情報。
 */
export function extractSponsors(proposalReason: string): Sponsor[] {
  const sponsors: Sponsor[] = [];
  const RE = /(提出者|賛成者)、((?:福津市議会議員[^、。]+、?)+)/g;

  let m: RegExpExecArray | null;
  while ((m = RE.exec(proposalReason)) !== null) {
    const role = m[1] === "提出者" ? "proposer" : "seconder";
    for (const name of m[2].split("福津市議会議員").slice(1)) {
      const memberName = name.replace(/[、。\s　]/g, "");
      if (memberName) sponsors.push({ role, memberName });
    }
  }

  return sponsors;
}

/** 採決のとり方を市民向けの一文にする */
export function describeVoteMethod(method: VoteMethod): string {
  switch (method) {
    case "majority":
      return "起立採決（賛成多数）";
    case "minority":
      return "起立採決（賛成少数）";
    case "chairDecision":
      return "起立採決で可否同数となり、議長が裁決";
    case "noObjection":
      return "異議なしで決定";
  }
}
