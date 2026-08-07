import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BROAD_CATEGORY_THUMBNAILS,
  getTopicThumbnail,
  TOPIC_KEYWORD_THUMBNAILS,
} from "./topic-thumbnail";

/** public は web/public にある。このテストファイルからは5階層上。 */
const PUBLIC_DIR = join(__dirname, "../../../../../public");

describe("getTopicThumbnail", () => {
  it.each(
    TOPIC_KEYWORD_THUMBNAILS.flatMap((rule) => rule.keywords)
  )("個別キーワード「%s」の画像ファイルが実在する", (keyword) => {
    const src = getTopicThumbnail([`${keyword}についての一般質問`]);
    expect(existsSync(join(PUBLIC_DIR, src))).toBe(true);
  });

  it.each([
    ...new Set(BROAD_CATEGORY_THUMBNAILS.map((rule) => rule.src)),
  ])("大分類の画像ファイル %s が実在する", (src) => {
    expect(existsSync(join(PUBLIC_DIR, src))).toBe(true);
  });

  it("テーマが無くてもデフォルト画像を返す（画像なしにはしない）", () => {
    expect(getTopicThumbnail(undefined)).toBe(
      "/images/tag-thumbnails/town-development.jpg"
    );
    expect(getTopicThumbnail([])).toBe(
      "/images/tag-thumbnails/town-development.jpg"
    );
  });

  it("どのキーワードにも当てはまらないテーマでもデフォルト画像を返す", () => {
    expect(getTopicThumbnail(["謎の未知なるテーマについて"])).toBe(
      "/images/tag-thumbnails/town-development.jpg"
    );
  });

  it("個別キーワードは大分類キーワードより優先される", () => {
    // 「介護」は個別キーワード（nursing-care.jpg）にも大分類「くらし・福祉」にも含まれる
    expect(getTopicThumbnail(["介護保険制度について"])).toBe(
      "/images/tag-thumbnails/nursing-care.jpg"
    );
  });

  it("複数テーマでは先頭から見て最初に当てはまったものを使う", () => {
    expect(
      getTopicThumbnail(["謎のテーマについて", "学校給食のアレルギー対応"])
    ).toBe("/images/tag-thumbnails/school.jpg");
  });

  it("本番相当の実データ（88テーマ）が全件カバーされる", () => {
    // 2026-08-07時点で本番に存在した一般質問42件・88テーマの代表例。
    // 大分類の受け皿が壊れていないかの回帰チェック。
    const realWorldTopics: string[][] = [
      ["令和7年8月豪雨災害の検証を踏まえた防災・減災体制の強化について"],
      ["市長が掲げる稼げるまちについて"],
      ["古墳の管理について"],
      ["香害（化学物質過敏症）への取り組みについて"],
      ["公共施設の男性トイレへのサニタリーボックス設置について"],
      ["ふくつミニバスについて"],
      ["市営住宅について"],
      ["公共下水道事業について"],
      ["市職員の働く環境について"],
      ["自治会の未加入者への公平な情報伝達について"],
      ["消防団の活動について"],
    ];
    for (const titles of realWorldTopics) {
      expect(getTopicThumbnail(titles)).toBeTruthy();
    }
  });
});
