import { describe, expect, it } from "vitest";
import type { JimuJigyoRecord } from "../types/jimu-jigyo";
import { countByBureau, countByCategory, filterRecords } from "./filter";

function record(input: {
  事業名: string;
  部局: string;
  課室?: string | null;
  大区分?: "継続" | "終了";
  小区分?: JimuJigyoRecord["見直し"]["小区分"];
}): JimuJigyoRecord {
  return {
    整理番号: 1,
    事業名: input.事業名,
    部局: input.部局,
    課室: input.課室 ?? null,
    成果指標: [],
    見直し: {
      大区分: input.大区分 ?? "継続",
      小区分: input.小区分 ?? "一部改善",
      理由: null,
      内容: null,
    },
    id: "x-001",
    analysis: {
      kpi: {
        direction: "unknown",
        changeRate: null,
        achievementRate: null,
        text: "",
      },
      budget: {
        direction: "unknown",
        changeRate: null,
        settlementDirection: "unknown",
        settlementChangeRate: null,
        text: "",
      },
      efficiency: { direction: "unknown", changeRate: null, text: "" },
    },
  };
}

const records = [
  record({
    事業名: "宿泊税導入対策事業",
    部局: "総務部",
    大区分: "継続",
    小区分: "一部改善",
  }),
  record({
    事業名: "観光振興事業",
    部局: "商工部観光局",
    大区分: "継続",
    小区分: "拡充",
  }),
  record({
    事業名: "旧制度廃止対応",
    部局: "商工部",
    大区分: "終了",
    小区分: "廃止",
  }),
];

describe("filterRecords", () => {
  it("部局コードで絞り込む（局は親部局に集約）", () => {
    const r = filterRecords(records, { bureau: "shoko" });
    expect(r.map((x) => x.事業名)).toEqual(["観光振興事業", "旧制度廃止対応"]);
  });

  it("見直し大区分で絞り込む", () => {
    expect(filterRecords(records, { category: "shuryo" })).toHaveLength(1);
    expect(filterRecords(records, { category: "keizoku" })).toHaveLength(2);
  });

  it("見直し小区分で絞り込む", () => {
    const r = filterRecords(records, { category: "keizoku-kakuju" });
    expect(r.map((x) => x.事業名)).toEqual(["観光振興事業"]);
  });

  it("キーワード（正規化して部分一致）", () => {
    expect(filterRecords(records, { q: "宿泊" })).toHaveLength(1);
    expect(filterRecords(records, { q: "ぜんぜん一致しない" })).toHaveLength(0);
  });

  it("複合条件はAND", () => {
    const r = filterRecords(records, { bureau: "shoko", category: "shuryo" });
    expect(r.map((x) => x.事業名)).toEqual(["旧制度廃止対応"]);
  });
});

describe("countByBureau", () => {
  it("親部局に集約して数える", () => {
    expect(countByBureau(records)).toEqual({ somu: 1, shoko: 2 });
  });
});

describe("countByCategory", () => {
  it("大区分・小区分別に数える", () => {
    const { major, minor } = countByCategory(records);
    expect(major).toEqual({ 継続: 2, 終了: 1 });
    expect(minor["継続:拡充"]).toBe(1);
    expect(minor["終了:廃止"]).toBe(1);
  });
});
