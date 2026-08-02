/**
 * 議案書PDFをテキスト化したものから、議案ごとの件名と「理由」を取り出す。
 *
 * 会議録から拾える「提案理由の説明」は、市長が本会議で読み上げた口頭の説明。
 * 一方こちらは議案書そのものに印刷されている正式な理由文で、
 *   - 予算議案（議案第4〜13号）には制度上そもそも「理由」欄が無い
 *   - 条例議案には必ず1つ載っている
 * という違いがある。両方あるときは議案書のほうを正とする。
 *
 * 元のPDFは市議会から提供を受けた資料で、再配布の可否が未確認のため
 * リポジトリには入れない。取り出した理由文だけを生成物としてコミットする。
 *
 * テキスト化の前提: poppler の pdftotext（レイアウト指定なし）
 *   - ページの先頭に改ページ文字（\f）が入る
 *   - 見出しは改ページ直後の行に来る
 *   - 1行に収まらない文は、途中に半角スペースが入って折り返される
 */
import { toHalfWidthDigits } from "./parse-bill-votes";

export type BillDocumentEntry = {
  /** 半角に直した議案番号。例「議案第19号」 */
  billNumber: string;
  /** 議案の件名 */
  title: string;
  /** 議案書に印刷されている理由。予算議案のように理由欄が無いものは null */
  reason: string | null;
};

/** 議案書に出てくる案件の種別。同意・諮問・認定・報告は人事案件や報告で理由欄が無い */
const KIND = "議案|発議|承認|同意|諮問|認定|報告";

/**
 * 番号の書き方は資料によってぶれる。
 * 「議案第１９号」のほか、字間を空けた「発議第 5 号」もある。
 */
const NUMBER = "第[\\s　]*[0-9０-９]+[\\s　]*号";

/** 改ページ直後に来る見出し行。件名が同じ行にある場合と、次の行に来る場合がある */
const HEADING_RE = new RegExp(`^\\f?((?:${KIND})${NUMBER})[\\s　]*(.*)$`);

/**
 * 巻頭の目次は「議案第１７号 議案第１８号 議案第１９号 …」と番号が並ぶだけの行になる。
 * 件名の位置にまた番号が来ていたら目次とみなして読み飛ばす。
 */
const TOC_LINE_RE = new RegExp(`^(?:${KIND})${NUMBER}`);

/** 「理 由」の行。ラベルと本文の間に空白が入る */
const REASON_RE = /^理[\s　]*由[\s　]*(.*)$/;

/** 発議の「８．設置理由」の行。番号の書式は資料によってぶれる */
const ESTABLISH_REASON_RE = /^[0-9０-９]+[．.、][\s　]*設置理由[\s　]*(.*)$/;

/** ページ番号だけの行。理由文の終わりの目印になる */
const PAGE_NUMBER_RE = /^[0-9０-９]+$/;

/**
 * PDFのテキスト化で入った空白を落とす。
 *
 * 日本語の文章なので、単語の区切りとしての空白はもともと存在しない。
 * 入っている空白は「行の折り返し」か「理 由」「福 井 崇 郎」のような字間調整なので、
 * すべて取り除くのがいちばん原文に近くなる。
 * 「令和 8 年 11 月」→「令和8年11月」のように数字まわりも正しくつながる。
 */
export function stripLayoutSpaces(text: string): string {
  return text.replace(/[\s　]+/g, "");
}

/**
 * 見出しと本文が同じ行につながって取れてしまうことがある。
 *   「議案第４号 令和６年度…補正予算（第５号）について地方自治法（昭和２２年…の規定により、…」
 * 件名は「…について」で終わるので、その後ろに本文の言い回しが続いていたら切り落とす。
 * 「…に関する条例の制定について」のように件名自体が長いものは、
 * 後ろに何も続かないのでそのまま残る。
 */
export function trimTitle(title: string): string {
  const at = title.indexOf("について");
  if (at === -1) return title;

  const head = title.slice(0, at + "について".length);
  const rest = title.slice(at + "について".length);
  return /の規定により|別案のとおり|次の理由により/.test(rest) ? head : title;
}

/** 理由文の終わりかどうか。空行・ページ番号・次の見出しで終わる */
function isEndOfReason(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed === "" ||
    PAGE_NUMBER_RE.test(trimmed) ||
    HEADING_RE.test(line) ||
    line.startsWith("\f")
  );
}

/**
 * 理由文がページの終わりで途切れている場合に、次のページの続きの位置を返す。
 * 続きではないと判断したら null。
 *
 * 【なぜ要るか】
 * 長い理由文はページをまたぐ。テキスト化すると
 *   理 由 …指定管理者については、福津市公
 *   （空行）
 *   69            ← ページ番号
 *   \fの施設における指定管理者の指定の手続等に関する条例…議決を求める。
 * のようになり、空行で打ち切ると文の途中で切れる。
 *
 * 誤って関係のない文をつなげないよう、条件を絞る。
 *   - 文が「。」で終わっていない（＝途中で切れている）ときだけ続きを探す
 *   - 空行とページ番号だけを読み飛ばし、改ページを必ずまたぐ
 *   - その先が次の議案の見出しなら、続きではないので打ち切る
 */
function findReasonContinuation(
  lines: string[],
  from: number,
  sentence: string
): number | null {
  if (/[。．]$/.test(sentence)) return null;

  let k = from;
  let crossedPage = false;
  while (k < lines.length) {
    if (lines[k].startsWith("\f")) crossedPage = true;
    const trimmed = lines[k].replace(/^\f/, "").trim();
    if (trimmed === "" || PAGE_NUMBER_RE.test(trimmed)) {
      k++;
      continue;
    }
    break;
  }

  if (!crossedPage || k >= lines.length) return null;
  return HEADING_RE.test(lines[k]) ? null : k;
}

/** 見出しの次の行にある件名を拾う。空行を挟むことがあるので少し先まで見る */
function findTitleBelow(lines: string[], from: number): string {
  for (let i = from; i < Math.min(from + 3, lines.length); i++) {
    const candidate = lines[i].trim();
    if (candidate !== "" && !PAGE_NUMBER_RE.test(candidate)) {
      return stripLayoutSpaces(candidate);
    }
  }
  return "";
}

/**
 * 議案書のテキストから、案件ごとの件名と理由を取り出す。
 * 同じ議案番号が複数回出てきた場合は、理由が取れたほうを残す。
 */
export function parseBillDocument(text: string): BillDocumentEntry[] {
  // 議案書PDFの改行はCRLF。行末に \r が残ると見出しの正規表現が外れる
  const lines = text.split(/\r?\n/);
  const found = new Map<string, BillDocumentEntry>();

  let current: BillDocumentEntry | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = line.match(HEADING_RE);

    if (heading) {
      if (TOC_LINE_RE.test(heading[2])) {
        current = null;
        continue;
      }
      // 「発議第 5 号」のような字間の空白を落としてから半角に直す
      const billNumber = toHalfWidthDigits(stripLayoutSpaces(heading[1]));
      const inlineTitle = stripLayoutSpaces(heading[2]);
      const title = trimTitle(inlineTitle || findTitleBelow(lines, i + 1));
      // 目次は1行に1件ずつ並ぶこともあり、その場合は件名の位置に次の番号が来る
      if (TOC_LINE_RE.test(title)) {
        current = null;
        continue;
      }
      current = { billNumber, title, reason: null };
      // 理由が取れている記録を、理由の無い再出現で上書きしないようにする
      const prev = found.get(billNumber);
      if (!prev?.reason) found.set(billNumber, current);
      continue;
    }

    if (!current || current.reason) continue;

    const reasonHead =
      line.match(REASON_RE)?.[1] ?? line.match(ESTABLISH_REASON_RE)?.[1];
    if (reasonHead === undefined) continue;

    const body: string[] = [reasonHead];
    let j = i + 1;
    while (j < lines.length) {
      if (isEndOfReason(lines[j])) {
        const next = findReasonContinuation(
          lines,
          j,
          stripLayoutSpaces(body.join(""))
        );
        if (next === null) break;
        body.push(lines[next]);
        j = next + 1;
        continue;
      }
      body.push(lines[j]);
      j++;
    }

    const reason = stripLayoutSpaces(body.join(""));
    current.reason = reason === "" ? null : reason;
    // 上の分岐で理由なしとして入れていた場合に備えて入れ直す
    found.set(current.billNumber, current);
  }

  return [...found.values()];
}
