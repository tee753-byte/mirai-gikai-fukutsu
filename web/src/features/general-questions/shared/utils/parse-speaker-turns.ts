export type SpeakerTurn = {
  speaker: string;
  text: string;
};

/**
 * 発言者の切り替わりを表す記号。
 * 会議録の書式は自治体によって違うため、両方を受け付ける。
 *   ◯ … 福岡市（すべての発言者が同じ記号）
 *   ○◆◎ … 福津市（○=議長 ◆=議員の質問 ◎=執行部の答弁・議員の討論）
 */
const SPEAKER_MARKER_RE = /[◯○◆◎]/;

/**
 * 会議録の原文を、発言者ごとのかたまりに分解する。
 * 画面表示にもテストにも使うため、サーバー／クライアントのどちらからも呼べる純粋関数にしている。
 */
export function parseSpeakerTurns(rawText: string): SpeakerTurn[] {
  const turns: SpeakerTurn[] = [];
  const segments = rawText
    .split(SPEAKER_MARKER_RE)
    .filter((s) => s.trim().length > 0);

  for (const seg of segments) {
    const separatorIdx = seg.search(/[\s　]/);
    if (separatorIdx === -1) {
      turns.push({ speaker: seg.trim(), text: "" });
      continue;
    }
    const speaker = seg.slice(0, separatorIdx).trim();
    const text = seg.slice(separatorIdx).trim();
    // 議長の発言は進行の呼び出しだけなので落とす
    if (speaker.includes("議長")) continue;
    turns.push({ speaker, text });
  }
  return turns;
}

/**
 * 質問した議員かどうか。質問者だけ議席番号つきで表記される。
 * 例: ◯58番（山田ゆみこ）／◆３番（山本祐平）
 */
export function isQuestionerSpeaker(speaker: string): boolean {
  return /^[0-9０-９]+番/.test(speaker);
}
