import type { CommitteeMeetingTopic, CommitteeSpeech } from "../types";

/** 原文ページの1セクション（議題見出し＋その範囲の発言） */
export type TranscriptSection = {
  /** 対応する議題。冒頭の開会手続き等はnull */
  topic: CommitteeMeetingTopic | null;
  speeches: CommitteeSpeech[];
};

/**
 * 発言一覧を議題の発言範囲（startVoiceNo〜endVoiceNo）でセクション分割する。
 * - 最初の議題より前の発言（開会手続き等）は先頭のtopic=nullセクションにまとめる
 * - 議題の境界となる発言（前議題の締めと次議題の宣言を含む）は次の議題側に含める
 * - 議題に範囲情報がない場合はセクションを作らない（発言は前のセクションに残る）
 */
export function buildTranscriptSections(
  speeches: CommitteeSpeech[],
  topics: CommitteeMeetingTopic[]
): TranscriptSection[] {
  const ranged = topics
    .filter((t) => t.startVoiceNo != null)
    .sort((a, b) => a.topicOrder - b.topicOrder);

  if (ranged.length === 0) {
    return speeches.length > 0 ? [{ topic: null, speeches }] : [];
  }

  const sections: TranscriptSection[] = [];
  const firstStart = ranged[0].startVoiceNo as number;
  const opening = speeches.filter((s) => s.voiceNo < firstStart);
  if (opening.length > 0) {
    sections.push({ topic: null, speeches: opening });
  }

  ranged.forEach((topic, i) => {
    const start = topic.startVoiceNo as number;
    const nextStart =
      i + 1 < ranged.length
        ? (ranged[i + 1].startVoiceNo as number)
        : Number.POSITIVE_INFINITY;
    sections.push({
      topic,
      speeches: speeches.filter(
        (s) => s.voiceNo >= start && s.voiceNo < nextStart
      ),
    });
  });

  return sections;
}
