import { describe, expect, it } from "vitest";
import {
  buildShareCardText,
  collectGlyphs,
  type ShareCardSource,
  TITLE_MAX_LENGTH,
  truncate,
} from "./build-share-card-text";

const baseSource: ShareCardSource = {
  name: "福津市一般職の職員の給与に関する条例の一部を改正する条例について",
  billNumber: "議案第12号",
  status: "approved",
  sessionName: "令和8年3月定例会",
  contentTitle: "市職員の給与を引き上げる条例改正",
};

describe("truncate", () => {
  it("最大文字数以下ならそのまま返す", () => {
    expect(truncate("短いタイトル", 10)).toBe("短いタイトル");
  });

  it("最大文字数ちょうどなら省略しない", () => {
    expect(truncate("あいうえお", 5)).toBe("あいうえお");
  });

  it("超える場合は末尾を三点リーダーにして最大文字数に収める", () => {
    const result = truncate("あいうえおかきくけこ", 5);
    expect(result).toBe("あいうえ…");
    expect(result.length).toBe(5);
  });

  it("前後の空白を落としてから判定する", () => {
    expect(truncate("  余白あり  ", 10)).toBe("余白あり");
  });
});

describe("buildShareCardText", () => {
  it("分かりやすいタイトルがあればそれを見出しにする", () => {
    expect(buildShareCardText(baseSource).title).toBe(
      "市職員の給与を引き上げる条例改正"
    );
  });

  it("分かりやすいタイトルが無ければ正式名称を使う", () => {
    const result = buildShareCardText({ ...baseSource, contentTitle: null });
    expect(result.title).toBe(truncate(baseSource.name, TITLE_MAX_LENGTH));
  });

  it("分かりやすいタイトルが空白だけなら正式名称にフォールバックする", () => {
    const result = buildShareCardText({ ...baseSource, contentTitle: "   " });
    expect(result.title).toBe(truncate(baseSource.name, TITLE_MAX_LENGTH));
  });

  it("見出しが長すぎる場合は切り詰める", () => {
    const longTitle = "あ".repeat(TITLE_MAX_LENGTH + 20);
    const result = buildShareCardText({
      ...baseSource,
      contentTitle: longTitle,
    });
    expect(result.title.length).toBe(TITLE_MAX_LENGTH);
    expect(result.title.endsWith("…")).toBe(true);
  });

  it("議案番号と定例会名を区切り文字でつなぐ", () => {
    expect(buildShareCardText(baseSource).meta).toBe(
      "議案第12号 ｜ 令和8年3月定例会"
    );
  });

  it("定例会名が無ければ議案番号だけを出す", () => {
    const result = buildShareCardText({ ...baseSource, sessionName: null });
    expect(result.meta).toBe("議案第12号");
  });

  it("議案番号も定例会名も無ければ空文字にする", () => {
    const result = buildShareCardText({
      ...baseSource,
      billNumber: null,
      sessionName: null,
    });
    expect(result.meta).toBe("");
  });

  it("審議状況を日本語ラベルに変換する", () => {
    expect(buildShareCardText(baseSource).status).toBe("可決");
    expect(
      buildShareCardText({ ...baseSource, status: "rejected" }).status
    ).toBe("否決");
    expect(
      buildShareCardText({ ...baseSource, status: "in_committee" }).status
    ).toBe("委員会審査中");
  });
});

describe("collectGlyphs", () => {
  it("重複した文字を1つにまとめる", () => {
    expect(collectGlyphs("ああいい", "いう")).toBe("あいう");
  });

  it("複数の文字列をまとめて扱える", () => {
    const result = collectGlyphs("可決", "議案");
    expect(result.split("").sort().join("")).toBe(
      "可決議案".split("").sort().join("")
    );
  });

  it("空文字を渡しても壊れない", () => {
    expect(collectGlyphs("", "")).toBe("");
  });
});
