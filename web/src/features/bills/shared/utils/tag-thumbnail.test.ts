import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getBillThumbnail,
  getKeywordThumbnail,
  getTagThumbnail,
  KEYWORD_THUMBNAILS,
  TAG_THUMBNAIL_BY_LABEL,
} from "./tag-thumbnail";

/**
 * 画像のパスは文字列で書くので、打ち間違いや消し忘れに気づけない。
 * 実物のファイルがあるかをここで検査する。
 *
 * public は web/public にある。このテストファイルからは5階層上。
 */
const PUBLIC_DIR = join(__dirname, "../../../../../public");

const TAG_LABELS = Object.keys(TAG_THUMBNAIL_BY_LABEL);

describe("getTagThumbnail", () => {
  it.each(TAG_LABELS)("%s の画像ファイルが実在する", (label) => {
    const src = getTagThumbnail([{ id: "t", label }]);
    expect(src, `${label} に画像が割り当てられていない`).toBeDefined();
    expect(existsSync(join(PUBLIC_DIR, src as string))).toBe(true);
  });

  it.each(
    Object.entries(TAG_THUMBNAIL_BY_LABEL).flatMap(([label, value]) =>
      Array.isArray(value) ? value.map((src) => [label, src] as const) : []
    )
  )("%s の全バリアント（%s）が実在する", (_label, variantSrc) => {
    expect(existsSync(join(PUBLIC_DIR, variantSrc))).toBe(true);
  });

  it("タグが無ければ undefined を返す", () => {
    expect(getTagThumbnail(undefined)).toBeUndefined();
    expect(getTagThumbnail([])).toBeUndefined();
  });

  it("知らないタグしか無ければ undefined を返す", () => {
    expect(
      getTagThumbnail([{ id: "t", label: "存在しないタグ" }])
    ).toBeUndefined();
  });

  it("複数タグでは先頭の対応する画像を使う", () => {
    const src = getTagThumbnail([
      { id: "a", label: "意見書・決議" },
      { id: "b", label: "子育て・教育" },
    ]);
    expect(src).toBe("/images/tag-thumbnails/opinion-resolution.jpg");
  });

  it("バリアントを持つタグは、同じseedなら常に同じ画像を返す（決定的）", () => {
    const first = getTagThumbnail(
      [{ id: "t", label: "議会・行政のしくみ" }],
      "同じ議案名"
    );
    const second = getTagThumbnail(
      [{ id: "t", label: "議会・行政のしくみ" }],
      "同じ議案名"
    );
    expect(first).toBe(second);
  });

  it("バリアントを持つタグは、seedによって複数の画像に分かれる", () => {
    const variants = TAG_THUMBNAIL_BY_LABEL["議会・行政のしくみ"];
    if (!Array.isArray(variants)) throw new Error("test setup invalid");

    const results = new Set(
      Array.from({ length: 20 }, (_, i) =>
        getTagThumbnail(
          [{ id: "t", label: "議会・行政のしくみ" }],
          `議案その${i}`
        )
      )
    );
    // 20件も試して1種類しか出ないのはハッシュが機能していない証拠
    expect(results.size).toBeGreaterThan(1);
    for (const r of results) {
      expect(variants).toContain(r);
    }
  });
});

describe("getKeywordThumbnail", () => {
  it("件名が空なら undefined を返す", () => {
    expect(getKeywordThumbnail(undefined, undefined)).toBeUndefined();
    expect(getKeywordThumbnail("", "")).toBeUndefined();
  });

  it("当てはまるキーワードが無ければ undefined を返す", () => {
    expect(
      getKeywordThumbnail("まったく関係のない議案", "関係のない要約")
    ).toBeUndefined();
  });

  it.each(
    KEYWORD_THUMBNAILS.flatMap((rule) => rule.keywords)
  )("キーワード「%s」の画像ファイルが実在する", (keyword) => {
    const src = getKeywordThumbnail(`テスト ${keyword} 条例`, undefined);
    expect(src, `${keyword} に画像が割り当てられていない`).toBeDefined();
    expect(existsSync(join(PUBLIC_DIR, src as string))).toBe(true);
  });

  it("実在の議案名で本番のキーワードが正しく当たる", () => {
    expect(
      getKeywordThumbnail(
        "福津市津屋崎千軒古民家条例を改正することについて",
        undefined
      )
    ).toBe("/images/tag-thumbnails/old-townhouse.jpg");
    expect(
      getKeywordThumbnail("福津市漁港管理条例を改正することについて", undefined)
    ).toBe("/images/tag-thumbnails/fishing-port.jpg");
  });

  it("給与・報酬系の条例は税条例より先に判定され、正しく分かれる", () => {
    expect(
      getKeywordThumbnail(
        "福津市特別職の職員で常勤のものの給与及び旅費に関する条例を改正することについて",
        undefined
      )
    ).toBe("/images/tag-thumbnails/pay-slip.jpg");
    expect(
      getKeywordThumbnail("福津市税条例を改正することについて", undefined)
    ).toBe("/images/tag-thumbnails/tax.jpg");
  });

  it("国民健康保険税条例は税条例ルールより先に国民健康保険ルールに当たる", () => {
    // 「福津市税条例」を含んでいそうで含んでいない（福津市国民健康保険税条例）ケース
    expect(
      getKeywordThumbnail(
        "福津市国民健康保険税条例を改正することについて",
        undefined
      )
    ).toBe("/images/tag-thumbnails/health-insurance.jpg");
  });
});

describe("getBillThumbnail", () => {
  it("キーワードに当てはまらなければタグの画像を使う", () => {
    const src = getBillThumbnail({
      name: "福津市附属機関設置条例を改正することについて",
      tags: [{ id: "t", label: "議会・行政のしくみ" }],
      bill_content: undefined,
    });
    const variants = TAG_THUMBNAIL_BY_LABEL["議会・行政のしくみ"];
    expect(Array.isArray(variants) ? variants : [variants]).toContain(src);
  });

  it("同じ議案なら、バリアントのあるタグでも毎回同じ画像になる", () => {
    const bill = {
      name: "福津市附属機関設置条例を改正することについて",
      tags: [{ id: "t", label: "議会・行政のしくみ" }],
      bill_content: undefined,
    };
    expect(getBillThumbnail(bill)).toBe(getBillThumbnail(bill));
  });

  it("キーワードにもタグにも当てはまらなければ undefined を返す", () => {
    const src = getBillThumbnail({
      name: "関係のない議案",
      tags: [],
      bill_content: undefined,
    });
    expect(src).toBeUndefined();
  });
});
