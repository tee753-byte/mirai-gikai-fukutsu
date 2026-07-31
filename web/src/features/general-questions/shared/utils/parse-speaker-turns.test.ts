import { describe, expect, it } from "vitest";
import { isQuestionerSpeaker, parseSpeakerTurns } from "./parse-speaker-turns";

// 福津市の会議録の書式。○=議長 ◆=議員の質問 ◎=執行部の答弁
const FUKUTSU_RAW = [
  "◆3番（山本祐平）　通告に従い質問いたします。",
  "◎市長（原崎智仁）　お答えいたします。",
  "◆3番（山本祐平）　では、更質問です。",
  "◎都市整備部長（長野健二）　再度お答えします。",
].join("\n\n");

describe("parseSpeakerTurns", () => {
  it("発言者ごとに分解し、順番を保つ", () => {
    const turns = parseSpeakerTurns(FUKUTSU_RAW);

    expect(turns).toHaveLength(4);
    expect(turns[0].speaker).toBe("3番（山本祐平）");
    expect(turns[0].text).toBe("通告に従い質問いたします。");
    // 更質問→再答弁が原文どおりの順で残ること
    expect(turns[2].text).toBe("では、更質問です。");
    expect(turns[3].speaker).toBe("都市整備部長（長野健二）");
  });

  it("議長の議事進行は落とす", () => {
    const raw = [
      "○議長（榎本博）　3番、山本議員。",
      "◆3番（山本祐平）　質問します。",
    ].join("\n\n");

    const turns = parseSpeakerTurns(raw);

    expect(turns).toHaveLength(1);
    expect(turns[0].speaker).toBe("3番（山本祐平）");
  });

  it("福岡市の書式（すべて◯）も分解できる", () => {
    const turns = parseSpeakerTurns("◯58番（山田ゆみこ）　質問します。");

    expect(turns).toHaveLength(1);
    expect(turns[0].speaker).toBe("58番（山田ゆみこ）");
  });

  it("本文が無い発言でも落ちない", () => {
    expect(parseSpeakerTurns("◆3番（山本祐平）")).toEqual([
      { speaker: "3番（山本祐平）", text: "" },
    ]);
  });

  it("空文字なら空配列を返す", () => {
    expect(parseSpeakerTurns("")).toEqual([]);
  });
});

describe("isQuestionerSpeaker", () => {
  it("議席番号つきの発言者は質問した議員とみなす", () => {
    expect(isQuestionerSpeaker("3番（山本祐平）")).toBe(true);
    // 会議録は議席番号が全角のことがある
    expect(isQuestionerSpeaker("１７番（中村清隆）")).toBe(true);
  });

  it("役職名の発言者は答弁者とみなす", () => {
    expect(isQuestionerSpeaker("市長（原崎智仁）")).toBe(false);
    expect(isQuestionerSpeaker("都市整備部長（長野健二）")).toBe(false);
  });
});
