import { describe, expect, it } from "vitest";
import {
  buildCategorySlug,
  parseCategorySlug,
  reviewBadgeTokens,
  reviewLabel,
} from "./review-category";

describe("parseCategorySlug", () => {
  it("大区分のみ", () => {
    expect(parseCategorySlug("keizoku")).toEqual({
      major: "継続",
      minor: null,
    });
    expect(parseCategorySlug("shuryo")).toEqual({ major: "終了", minor: null });
  });

  it("小区分あり（ハイフン含む小区分も分解できる）", () => {
    expect(parseCategorySlug("keizoku-kakuju")).toEqual({
      major: "継続",
      minor: "拡充",
    });
    expect(parseCategorySlug("keizoku-ichibu-kaizen")).toEqual({
      major: "継続",
      minor: "一部改善",
    });
    expect(parseCategorySlug("shuryo-haishi")).toEqual({
      major: "終了",
      minor: "廃止",
    });
  });

  it("大区分と小区分の組み合わせが不正なら null", () => {
    // 廃止は終了の小区分。継続には属さない
    expect(parseCategorySlug("keizoku-haishi")).toBeNull();
    expect(parseCategorySlug("unknown")).toBeNull();
    expect(parseCategorySlug(undefined)).toBeNull();
  });
});

describe("buildCategorySlug", () => {
  it("parseCategorySlug と往復できる", () => {
    for (const slug of ["keizoku", "keizoku-kakuju", "shuryo-haishi"]) {
      const parsed = parseCategorySlug(slug);
      if (!parsed) throw new Error(`parse失敗: ${slug}`);
      expect(buildCategorySlug(parsed.major, parsed.minor)).toBe(slug);
    }
  });
});

describe("reviewLabel", () => {
  it("大区分＋小区分を括弧表記にする", () => {
    expect(reviewLabel("継続", "一部改善")).toBe("継続（一部改善）");
    expect(reviewLabel("終了", null)).toBe("終了");
    expect(reviewLabel(null, null)).toBe("―");
  });
});

describe("reviewBadgeTokens", () => {
  it("小区分ごとに配色トークンを返す", () => {
    expect(reviewBadgeTokens("拡充").text).toBe("text-review-kakuju-text");
    expect(reviewBadgeTokens("一部改善").text).toBe("text-review-kaizen-text");
    expect(reviewBadgeTokens("廃止").bg).toBe("bg-review-haishi-bg");
  });

  it("null はデフォルト配色", () => {
    expect(reviewBadgeTokens(null).bg).toBe("bg-mirai-surface-muted");
  });
});
