import { describe, expect, it } from "vitest";
import { TOPICS } from "./data";
import { splitTitleByMarks } from "./split-title-by-marks";

const render = (title: string, marks: string[]) =>
  splitTitleByMarks(title, marks)
    .map((s) => (s.marked ? `[${s.text}]` : s.text))
    .join("");

describe("splitTitleByMarks", () => {
  it("指定が無ければ全体を1つの通常テキストにする", () => {
    expect(splitTitleByMarks("見出し", undefined)).toEqual([
      { text: "見出し", marked: false },
    ]);
  });

  it("指定した語句だけをマーク扱いにして前後を保つ", () => {
    expect(render("AがBをCした", ["B"])).toBe("Aが[B]をCした");
  });

  it("複数の指定は出現順に並べる", () => {
    expect(render("1234567", ["56", "12"])).toBe("[12]34[56]7");
  });

  it("見出しに無い語句は無視する", () => {
    expect(render("見出し", ["存在しない"])).toBe("見出し");
  });

  it("重なる指定は先に出る側だけを使う", () => {
    expect(render("abcdef", ["abc", "cde"])).toBe("[abc]def");
  });
});

describe("TOPICS の marks", () => {
  it("すべての語句が、そのトピックの見出しにそのまま含まれている", () => {
    for (const topic of TOPICS) {
      for (const mark of topic.marks ?? []) {
        expect(topic.title, topic.slug).toContain(mark);
      }
    }
  });

  it("可決・否決などの結果の語は、マーカーの対象にしない", () => {
    const resultWords = ["可決", "否決", "採択", "懸念"];
    for (const topic of TOPICS) {
      for (const mark of topic.marks ?? []) {
        for (const word of resultWords) {
          expect(mark, topic.slug).not.toContain(word);
        }
      }
    }
  });
});
