/**
 * parse-minutes.ts（福津市版）
 *
 * 福津市議会の会議録テキストをパースして発言ブロックに分割する純粋関数群。
 *
 * ■ 福岡市版（packages/seed/fukuoka/parse-minutes.ts）との違い
 * 福岡市の会議録は発言者がすべて「◯」で始まるため、役職名の一覧（局長・市長…）を
 * 正規表現に持たせて答弁者かどうかを判定していた。
 * 福津市の会議録（会議録検索システム）は記号そのものが発言の立場を表す。
 *
 *   ○議長（髙山賢二）        … 議事進行
 *   ◆３番（山本祐平）        … 議員の質疑・質問
 *   ◎市長（福井崇郎）        … 執行部の答弁・説明
 *   ◎総務文教委員長（石田まなみ） … 委員長報告
 *   ◎３番（山本祐平）        … 議員自身の提案理由説明・討論（答弁ではない）
 *   △日程第１一般質問        … 日程の見出し
 *
 * このため役職名の一覧を持つ必要がなく、福津市の組織改編（部長名の変更など）が
 * あってもパーサを直さずに済む。
 * ただし「◎＋議席番号」は執行部の答弁ではないので、答弁として混ぜないよう
 * memberStatement という別の種別にしている。
 */

/** 発言者の種別 */
export type SpeakerType =
  | "chairperson" // 議長（議事進行）
  | "questioner" // 議員の質疑・質問（◆）
  | "answerer" // 執行部の答弁・委員長報告（◎＋役職名）
  | "memberStatement"; // 議員の提案理由説明・討論（◎＋議席番号）

/** 1つの発言ブロック */
export type SpeechBlock = {
  speakerType: SpeakerType;
  /** 発言者の氏名（全角スペースを除去済み） */
  speakerName: string;
  /** 議席番号。半角数字に正規化する（例: "3"）。議員の発言のみ */
  speakerNumber?: string;
  /** 役職（例: "市長", "教育部長", "総務文教委員長"）。議長・執行部のみ */
  speakerRole?: string;
  /** 発言本文。改行は段落区切りとして保持する */
  text: string;
};

/** 1人分の一般質問（登壇での通告 ＋ その後の一問一答すべて） */
export type GeneralQuestionSection = {
  questionerName: string;
  questionerNumber: string;
  /** 登壇時の発言。通告した質問事項・質問要旨がすべて述べられる */
  notice: string;
  /** 議長を除く全発言（登壇を含む） */
  speeches: SpeechBlock[];
};

/** 行頭の発言者記号 */
const SPEAKER_LINE_RE = /^([○◆◎])(.+?)（(.+?)）/;
/** 日程の見出し行（例: △日程第１一般質問） */
const AGENDA_LINE_RE = /^△/;
/** 「１７番」のような議席番号ラベル。全角・半角どちらも受ける */
const SEAT_LABEL_RE = /^([0-9０-９]+)番$/;
/** 議長が1人分の一般質問の終わりを宣言する行 */
const QUESTION_END_RE = /以上で、.+?の一般質問を終わ[りる]ます/;

/** 全角数字を半角に変換する */
function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
}

/**
 * 氏名から全角スペースを取り除く
 * 会議録では姓名の区切りに全角スペースが入ることがあるため揃える
 */
export function normalizeName(value: string): string {
  return value.replace(/[\s　]/g, "");
}

/** テキストから議案番号を抽出する（例: ["9", "45"]） */
export function extractBillNumbers(text: string): string[] {
  const matches = [...text.matchAll(/議案第([0-9０-９]+)号/g)];
  const numbers = matches.map((m) => toHalfWidthDigits(m[1]));
  return [...new Set(numbers)];
}

/**
 * 登壇の発言から質問事項（大項目）を抽出する。
 *
 * 福津市の一般質問は「通告書に基づき、大きく○点お尋ねします」と述べたあと、
 * 質問事項ごとに要旨を読み上げ、最後に①②③…と細目を挙げる形式が多い。
 * ここでは細目（①〜⑳ または (1)(2)…）だけを機械的に拾う。
 * 大項目の切り出しは議員ごとに書き方が違うため、パーサでは扱わず人が確認する。
 */
export function extractNoticeItems(notice: string): string[] {
  const items: string[] = [];
  for (const rawLine of notice.split("\n")) {
    const line = rawLine.trim();
    const match = line.match(/^[　\s]*([①-⑳]|[(（][0-9０-９]+[)）])[　\s]*(.+)$/);
    if (match && match[2].length > 0) {
      items.push(match[2].trim());
    }
  }
  return items;
}

/**
 * 会議録テキストを発言ブロック一覧にパースする。
 *
 * 発言者記号で始まらない行は直前の発言の続きとして連結する。
 * 冒頭の出席議員名簿など、最初の発言者行より前は無視される。
 */
export function parseMinutes(text: string): SpeechBlock[] {
  const blocks: SpeechBlock[] = [];

  let currentBlock: SpeechBlock | null = null;
  let currentLines: string[] = [];

  function flushBlock() {
    if (currentBlock) {
      currentBlock.text = currentLines
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .join("\n");
      if (currentBlock.text.length > 0) {
        blocks.push(currentBlock);
      }
    }
    currentBlock = null;
    currentLines = [];
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    // 日程の見出しは発言ではないので、直前の発言をここで区切る
    if (AGENDA_LINE_RE.test(line)) {
      flushBlock();
      continue;
    }

    const match = line.match(SPEAKER_LINE_RE);
    if (!match) {
      // 発言の続き
      if (currentBlock) {
        currentLines.push(line);
      }
      continue;
    }

    flushBlock();

    const [, marker, label, rawName] = match;
    const name = normalizeName(rawName);
    // 「◆３番（山本祐平）」の後ろに続く本文を取り出す
    const rest = line.slice(match[0].length).replace(/^(?:登壇)?/, "");
    const seatMatch = label.match(SEAT_LABEL_RE);

    if (marker === "○") {
      currentBlock = {
        speakerType: "chairperson",
        speakerName: name,
        speakerRole: label,
        text: "",
      };
    } else if (marker === "◆") {
      currentBlock = {
        speakerType: "questioner",
        speakerName: name,
        speakerNumber: seatMatch ? toHalfWidthDigits(seatMatch[1]) : undefined,
        text: "",
      };
    } else if (seatMatch) {
      // ◎＋議席番号 = 議員自身の提案理由説明・討論。執行部の答弁ではない
      currentBlock = {
        speakerType: "memberStatement",
        speakerName: name,
        speakerNumber: toHalfWidthDigits(seatMatch[1]),
        text: "",
      };
    } else {
      currentBlock = {
        speakerType: "answerer",
        speakerName: name,
        speakerRole: label,
        text: "",
      };
    }

    currentLines = [rest];
  }

  flushBlock();
  return blocks;
}

/**
 * 発言ブロックを、会議録と同じ「記号＋発言者（氏名）　本文」の形に戻す。
 *
 * general_questions.raw_text に入れて、サイト側の RawTranscriptView が
 * 議員と執行部のやり取りとして表示するために使う。
 *
 * 一般質問の価値は登壇での通告よりも、そのあとの更質問（再質問）のやり取りにある。
 * 要約だけを載せると議員がその場で何を追及したかが消えてしまうため、
 * やり取りは要約せずそのまま保存する。
 */
export function buildTranscript(speeches: SpeechBlock[]): string {
  const lines: string[] = [];
  for (const s of speeches) {
    if (s.speakerType === "chairperson") continue;
    const label =
      s.speakerType === "answerer"
        ? s.speakerRole
        : `${s.speakerNumber ?? ""}番`;
    const marker = s.speakerType === "questioner" ? "◆" : "◎";
    lines.push(`${marker}${label}（${s.speakerName}）　${s.text}`);
  }
  return lines.join("\n\n");
}

/**
 * 一般質問の日の発言ブロックを、議員1人分ずつに切り分ける。
 *
 * 区切りは議長の「以上で、○○議員の一般質問を終わります」。
 * 中村議員が3人いるためこの宣言だけでは個人を特定できないので、
 * 氏名と議席番号は ◆ の発言ブロックから取る。
 *
 * 終了宣言で閉じられた分だけを返す。
 * 議案質疑や討論しかない日にも ◆ と ◎ のやり取りはあるが、
 * 終了宣言が出ないため一般質問として拾われることはない。
 */
export function splitGeneralQuestions(
  blocks: SpeechBlock[]
): GeneralQuestionSection[] {
  const sections: GeneralQuestionSection[] = [];
  let currentSpeeches: SpeechBlock[] = [];

  function flushSection() {
    const questionerSpeeches = currentSpeeches.filter(
      (s) => s.speakerType === "questioner"
    );
    if (questionerSpeeches.length > 0) {
      const first = questionerSpeeches[0];
      sections.push({
        questionerName: first.speakerName,
        questionerNumber: first.speakerNumber ?? "",
        notice: first.text,
        speeches: currentSpeeches,
      });
    }
    currentSpeeches = [];
  }

  for (const block of blocks) {
    if (block.speakerType === "chairperson") {
      // 議長発言そのものは残さないが、終了宣言は区切りとして使う
      if (QUESTION_END_RE.test(block.text)) {
        flushSection();
      }
      continue;
    }
    currentSpeeches.push(block);
  }

  // 終了宣言のないまま残った発言は一般質問ではないので捨てる
  return sections;
}
