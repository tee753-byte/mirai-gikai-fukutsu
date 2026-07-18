/** 発言テキストの1セグメント */
export type SpeechSegment = {
  /** interjectionは〔「なし」と呼ぶ者がある〕のような場内の様子の記録 */
  kind: "text" | "interjection";
  content: string;
};

const INTERJECTION_RE = /^[\s　]*〔(.+)〕[\s　]*$/;

/**
 * 発言テキストを本文と場内の様子（〔…〕行）に分割する。
 * チャット表示で場内の様子を中央のシステムメッセージとして出すために使う。
 * 連続する本文行は1セグメントにまとめる。
 */
export function splitSpeechSegments(text: string): SpeechSegment[] {
  const segments: SpeechSegment[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content.length > 0) {
      segments.push({ kind: "text", content });
    }
    buffer = [];
  };

  for (const line of text.split("\n")) {
    const interjection = line.match(INTERJECTION_RE);
    if (interjection) {
      flush();
      segments.push({ kind: "interjection", content: interjection[1] });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return segments;
}
