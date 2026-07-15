// 評価書PDF由来の自由記述テキストを、画面表示用に整える。
//
// PDFの改行には2種類ある:
//   1. レイアウト上の折り返し（右端に達したので改行された）… 文の途中で切れる。消したい
//   2. 意味のある改行（見出し・箇条書き・段落の区切り）… 残したい
// 抽出時は原文に忠実に両方とも \n として保持しているため、表示時にここで1だけを畳む。
// 日本語は語間に空白を入れないため、連結時に空白は挿入しない。

/** 次の行が箇条書き・見出し・番号で始まる場合、その改行は意味を持つ */
const MARKER_START =
  /^\s*(・|○|●|◯|◎|■|□|▲|△|[①-⑳]|[（(【＜<「『※＊*]|\d+[\s.．、)）]|[ⅠⅡⅢⅣⅤⅥ]|[ア-ンａ-ｚA-Za-z][\s.．、)）])/;

/** 「（評価）」のように括弧だけで完結する短い行は見出し扱い */
const HEADING_ONLY = /^\s*[（(【].{0,20}[)）】]\s*$/;

/** 文末（句点・感嘆・疑問・コロン）で終わる行の改行は残す */
const SENTENCE_END = /[。！？：:]\s*$/;

/**
 * 直前の行と現在の行の間の改行が、PDFの折り返し（＝消すべき）かどうか
 */
function isWrappedBreak(prev: string, cur: string): boolean {
  if (!prev.trim() || !cur.trim()) return false; // 空行は段落区切りとして残す
  if (MARKER_START.test(cur)) return false;
  if (SENTENCE_END.test(prev)) return false;
  if (HEADING_ONLY.test(prev)) return false;
  return true;
}

/**
 * PDF由来テキストの折り返し改行だけを畳んで返す。
 * 見出し・箇条書き・段落の改行は保持する。
 */
export function normalizePdfText(
  text: string | null | undefined
): string | null {
  if (!text) return null;
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (out.length === 0) {
      out.push(line);
      continue;
    }
    const prev = out[out.length - 1];
    if (isWrappedBreak(prev, line)) {
      out[out.length - 1] = prev.trimEnd() + line.trimStart();
    } else {
      out.push(line);
    }
  }
  return out.join("\n").trim() || null;
}
