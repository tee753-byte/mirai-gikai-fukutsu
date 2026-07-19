import { describe, expect, it } from "vitest";
import { splitSpeechSegments } from "./split-speech-segments";

describe("splitSpeechSegments", () => {
  it("〔…〕行を場内の様子として分離する", () => {
    const text =
      "これより質疑を行います。何か質疑はありませんか。\n　　　　　〔「なし」と呼ぶ者がある〕";
    expect(splitSpeechSegments(text)).toEqual([
      {
        kind: "text",
        content: "これより質疑を行います。何か質疑はありませんか。",
      },
      { kind: "interjection", content: "「なし」と呼ぶ者がある" },
    ]);
  });

  it("場内の様子を挟んで本文が続く場合は3セグメントになる", () => {
    const text =
      "御異議ありませんか。\n　　　　　〔「異議なし」と呼ぶ者がある〕\n御異議がありませんので、そのように決定いたします。";
    const segments = splitSpeechSegments(text);
    expect(segments).toHaveLength(3);
    expect(segments[1]).toEqual({
      kind: "interjection",
      content: "「異議なし」と呼ぶ者がある",
    });
    expect(segments[2].content).toBe(
      "御異議がありませんので、そのように決定いたします。"
    );
  });

  it("場内の様子がなければ全文を1セグメントで返す", () => {
    const text = "それでは、説明いたします。\n続きの説明です。";
    expect(splitSpeechSegments(text)).toEqual([
      { kind: "text", content: text },
    ]);
  });

  it("空文字は空配列を返す", () => {
    expect(splitSpeechSegments("")).toEqual([]);
  });
});
