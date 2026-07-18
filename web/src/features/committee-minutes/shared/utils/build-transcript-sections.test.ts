import { describe, expect, it } from "vitest";
import type { CommitteeMeetingTopic, CommitteeSpeech } from "../types";
import { buildTranscriptSections } from "./build-transcript-sections";

const speech = (voiceNo: number): CommitteeSpeech => ({
  voiceNo,
  speakerLabel: `発言者${voiceNo}`,
  speakerType: "member",
  text: `発言${voiceNo}`,
});

const topic = (
  topicOrder: number,
  startVoiceNo: number | null,
  endVoiceNo: number | null
): CommitteeMeetingTopic => ({
  id: `topic-${topicOrder}`,
  topicOrder,
  title: `議題${topicOrder}`,
  summary: null,
  discussionSummary: null,
  speakers: [],
  startVoiceNo,
  endVoiceNo,
});

describe("buildTranscriptSections", () => {
  const speeches = [1, 2, 3, 4, 5, 6].map(speech);

  it("議題の範囲で分割し、冒頭の手続きは先頭セクションにまとめる", () => {
    const sections = buildTranscriptSections(speeches, [
      topic(1, 2, 4),
      topic(2, 4, 6),
    ]);
    expect(sections).toHaveLength(3);
    expect(sections[0].topic).toBeNull();
    expect(sections[0].speeches.map((s) => s.voiceNo)).toEqual([1]);
    expect(sections[1].topic?.topicOrder).toBe(1);
    expect(sections[1].speeches.map((s) => s.voiceNo)).toEqual([2, 3]);
    expect(sections[2].topic?.topicOrder).toBe(2);
    expect(sections[2].speeches.map((s) => s.voiceNo)).toEqual([4, 5, 6]);
  });

  it("議題が発言1から始まる場合は冒頭セクションを作らない", () => {
    const sections = buildTranscriptSections(speeches, [topic(1, 1, 6)]);
    expect(sections).toHaveLength(1);
    expect(sections[0].topic?.topicOrder).toBe(1);
    expect(sections[0].speeches).toHaveLength(6);
  });

  it("議題がない会議は全発言を1セクションで返す", () => {
    const sections = buildTranscriptSections(speeches, []);
    expect(sections).toHaveLength(1);
    expect(sections[0].topic).toBeNull();
    expect(sections[0].speeches).toHaveLength(6);
  });

  it("発言も議題もなければ空配列を返す", () => {
    expect(buildTranscriptSections([], [])).toEqual([]);
  });

  it("範囲情報のない議題はセクションにしない", () => {
    const sections = buildTranscriptSections(speeches, [topic(1, null, null)]);
    expect(sections).toHaveLength(1);
    expect(sections[0].topic).toBeNull();
  });
});
