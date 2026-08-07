import {
  type BillStatusEnum,
  getBillStatusLabel,
} from "@/features/bills/shared/types";

/**
 * シェア画像に描画する文字列。
 * 画像サイズにもDBの都合にも依存しない純粋なデータなので、ここだけをテストする。
 */
export type ShareCardText = {
  /** カード中央に大きく出す議案の見出し */
  title: string;
  /** 議案番号と定例会名（例: "議案第12号 ｜ 令和8年3月定例会"）。無ければ空文字 */
  meta: string;
  /** 審議状況のラベル（例: "可決"） */
  status: string;
};

export type ShareCardSource = {
  /** 議案の正式名称 */
  name: string;
  /** 議案番号（例: "議案第12号"） */
  billNumber: string | null;
  status: BillStatusEnum;
  /** 定例会名（例: "令和8年3月定例会"） */
  sessionName: string | null;
  /** bill_contents の分かりやすいタイトル。あればこちらを優先する */
  contentTitle: string | null;
};

/**
 * 見出しの最大文字数。
 * これを超えると画像の縦幅からあふれて文字が欠けるため、描画前に切る。
 * satori の省略表示に頼らないのは、日本語の折り返し位置が環境で変わるため。
 */
export const TITLE_MAX_LENGTH = 44;

export function truncate(text: string, maxLength: number): string {
  const normalized = text.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

export function buildShareCardText(source: ShareCardSource): ShareCardText {
  // 正式名称は「〜条例の一部を改正する条例について」のように長く読みにくい。
  // 分かりやすいタイトルが用意されていればそちらを使う。
  const rawTitle = source.contentTitle?.trim() || source.name;

  const metaParts = [source.billNumber, source.sessionName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return {
    title: truncate(rawTitle, TITLE_MAX_LENGTH),
    meta: metaParts.join(" ｜ "),
    status: getBillStatusLabel(source.status),
  };
}

/**
 * フォントの絞り込みに使う、画像に出てくる文字の一覧。
 * Google Fonts に「この字だけ」と渡すため、重複を除いた文字列にする。
 */
export function collectGlyphs(...texts: string[]): string {
  return Array.from(new Set(texts.join("").split(""))).join("");
}
