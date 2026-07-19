import { describe, expect, it } from "vitest";
import type { CommitteeSpeech } from "../types";
import { isNameCallSpeech, normalizeSpeeches } from "./normalize-speeches";

describe("normalizeSpeeches", () => {
  it("先頭ブロックの日時記録を除去し、埋め込まれた発言を分割する", () => {
    const speeches: CommitteeSpeech[] = [
      {
        voiceNo: 1,
        speakerLabel: null,
        speakerType: "unknown",
        text: "　　　令和八年四月二十八日（火曜日）\n　　　午　後　四　時　一　分　開　会\n◯井上博行委員長　それでは、開会いたします。\n　議題は配付のとおりです。",
      },
      {
        voiceNo: 2,
        speakerLabel: "佐々木空港政策課長",
        speakerType: "executive",
        text: "説明いたします。",
      },
    ];
    const result = normalizeSpeeches(speeches);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      voiceNo: 1,
      speakerLabel: "井上博行委員長",
      speakerType: "chairperson",
    });
    expect(result[0].text).toBe(
      "それでは、開会いたします。\n　議題は配付のとおりです。"
    );
    expect(result[1].speakerLabel).toBe("佐々木空港政策課長");
  });

  it("記録行だけのブロックは取り除く", () => {
    const speeches: CommitteeSpeech[] = [
      {
        voiceNo: 1,
        speakerLabel: null,
        speakerType: "unknown",
        text: "　　　令和八年三月六日（金曜日）\n　　　午　後　二　時　二　十　四　分　開　会",
      },
    ];
    expect(normalizeSpeeches(speeches)).toEqual([]);
  });

  it("改行で分断された発言者ラベルを修復する", () => {
    const speeches: CommitteeSpeech[] = [
      {
        voiceNo: 24,
        speakerLabel: "堀",
        speakerType: "executive",
        text: "大助委員　今のに関連して伺います。",
      },
    ];
    const result = normalizeSpeeches(speeches);
    expect(result[0]).toMatchObject({
      speakerLabel: "堀大助委員",
      speakerType: "member",
      text: "今のに関連して伺います。",
    });
  });

  it("ラベル付きの発言はそのまま保持する", () => {
    const speeches: CommitteeSpeech[] = [
      {
        voiceNo: 3,
        speakerLabel: "堀大助委員",
        speakerType: "member",
        text: "質問します。",
        simpleText: "質問するよ。",
      },
    ];
    expect(normalizeSpeeches(speeches)).toEqual(speeches);
  });
});

describe("isNameCallSpeech", () => {
  const speech = (
    text: string,
    speakerType: CommitteeSpeech["speakerType"] = "chairperson"
  ): CommitteeSpeech => ({
    voiceNo: 1,
    speakerLabel: "井上博行委員長",
    speakerType,
    text,
  });

  it("指名だけの発言を判定する", () => {
    expect(isNameCallSpeech(speech("山田空港事業課長。"))).toBe(true);
    expect(isNameCallSpeech(speech("秋田交通政策課長。"))).toBe(true);
  });

  it("指名以外の発言は判定しない", () => {
    expect(
      isNameCallSpeech(speech("説明は終わりました。これより質疑を行います。"))
    ).toBe(false);
    expect(isNameCallSpeech(speech("順次執行部の説明を求めます。"))).toBe(
      false
    );
  });

  it("委員長以外の発言は対象外", () => {
    expect(isNameCallSpeech(speech("山田空港事業課長。", "member"))).toBe(
      false
    );
  });
});
