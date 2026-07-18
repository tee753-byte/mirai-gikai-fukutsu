import { describe, expect, it } from "vitest";
import { formatJapaneseDate } from "./format-japanese-date";

describe("formatJapaneseDate", () => {
  it("ISO日付を和暦風の表記に変換する", () => {
    expect(formatJapaneseDate("2026-04-28")).toBe("2026年4月28日（火）");
    expect(formatJapaneseDate("2026-01-06")).toBe("2026年1月6日（火）");
  });

  it("不正な日付はそのまま返す", () => {
    expect(formatJapaneseDate("invalid")).toBe("invalid");
  });
});
