import { describe, expect, it } from "vitest";
import type { JimuJigyoData } from "../types/jimu-jigyo";
import { analyzeBudget, analyzeEfficiency, analyzeKpi } from "./analysis";

function base(over: Partial<JimuJigyoData>): JimuJigyoData {
  return {
    整理番号: 1,
    事業名: "テスト事業",
    部局: "総務部",
    課室: "テスト課",
    成果指標: [],
    見直し: { 大区分: "継続", 小区分: "一部改善", 理由: null, 内容: null },
    ...over,
  };
}

describe("analyzeKpi", () => {
  it("実績が前年比+10%以上なら up・達成率も算出", () => {
    const data = base({
      成果指標: [
        { 内容: "登録者数", 目標: { R6: 100 }, 実績: { R5: 80, R6: 120 } },
      ],
    });
    const r = analyzeKpi(data, "R6");
    expect(r.direction).toBe("up");
    expect(r.changeRate).toBeCloseTo(0.5);
    expect(r.achievementRate).toBeCloseTo(120);
  });

  it("実績減少なら down", () => {
    const data = base({
      成果指標: [
        { 内容: "件数", 目標: { R6: 100 }, 実績: { R5: 100, R6: 80 } },
      ],
    });
    expect(analyzeKpi(data, "R6").direction).toBe("down");
  });

  it("欠測語彙（調査中）は unknown", () => {
    const data = base({
      成果指標: [
        { 内容: "件数", 目標: { R6: 100 }, 実績: { R5: 80, R6: "調査中" } },
      ],
    });
    expect(analyzeKpi(data, "R6").direction).toBe("unknown");
  });

  it("成果指標なしは unknown", () => {
    expect(analyzeKpi(base({}), "R6").direction).toBe("unknown");
  });
});

describe("analyzeBudget", () => {
  it("主指標は当初予算どうしの前年比（R7当初→R8当初）", () => {
    const data = base({
      事業費: {
        年度別: {
          R6決算: { 歳出: 1200 },
          R7当初: { 歳出: 1000 },
          R8当初: { 歳出: 1300 },
        },
      },
    });
    const r = analyzeBudget(data, "R6");
    expect(r.direction).toBe("up");
    expect(r.changeRate).toBeCloseTo(0.3); // 1000 → 1300
  });

  it("R5決算が無くても当初予算ベースで評価できる（実データの大半＝227件のパターン）", () => {
    const data = base({
      事業費: {
        年度別: {
          R6決算: { 歳出: 1200 },
          R7当初: { 歳出: 1000 },
          R8当初: { 歳出: 500 },
        },
      },
    });
    const r = analyzeBudget(data, "R6");
    expect(r.direction).toBe("down"); // 以前は unknown だった
    expect(r.changeRate).toBeCloseTo(-0.5);
    expect(r.settlementDirection).toBe("unknown"); // 決算は1点のみ
  });

  it("決算どうしの比較は突合できた事業でのみ副指標として出す", () => {
    const data = base({
      事業費: {
        年度別: {
          R5決算: { 歳出: 1000 },
          R6決算: { 歳出: 1200 },
          R7当初: { 歳出: 1000 },
          R8当初: { 歳出: 1000 },
        },
      },
    });
    const r = analyzeBudget(data, "R6");
    expect(r.settlementDirection).toBe("up");
    expect(r.settlementChangeRate).toBeCloseTo(0.2); // 1000 → 1200
    expect(r.direction).toBe("flat"); // 当初は横ばい
  });

  it("翌年度当初が無ければ主指標は unknown（実データ37件のパターン）", () => {
    const data = base({
      事業費: { 年度別: { R6決算: { 歳出: 1200 }, R7当初: { 歳出: 1000 } } },
    });
    const r = analyzeBudget(data, "R6");
    expect(r.direction).toBe("unknown");
    expect(r.text).toContain("記載されていない");
  });

  it("決算と当初を直接比較しない（補正の有無で誤った増減が出るため）", () => {
    // R6決算1200 → R7当初1000 は -17% だが、これは主指標にしない
    const data = base({
      事業費: {
        年度別: {
          R6決算: { 歳出: 1200 },
          R7当初: { 歳出: 1000 },
          R8当初: { 歳出: 1000 },
        },
      },
    });
    const r = analyzeBudget(data, "R6");
    expect(r.changeRate).toBeCloseTo(0); // 当初どうしは横ばい
    expect(r.direction).toBe("flat");
  });

  it("事業費が無ければデータなし", () => {
    const r = analyzeBudget(base({}), "R6");
    expect(r.direction).toBe("unknown");
    expect(r.text).toContain("データがありません");
  });
});

describe("analyzeEfficiency", () => {
  it("達成率一定で決算削減ならコスト効率 up", () => {
    const data = base({
      成果指標: [
        { 内容: "率", 目標: { R5: 100, R6: 100 }, 実績: { R5: 90, R6: 90 } },
      ],
      事業費: { 年度別: { R5決算: { 歳出: 1000 }, R6決算: { 歳出: 500 } } },
    });
    // 達成率90%一定・決算半減 → 効率2倍
    expect(analyzeEfficiency(data, "R6").direction).toBe("up");
  });

  it("決算が揃わなければ unknown", () => {
    const data = base({
      事業費: { 年度別: { R6決算: { 歳出: 500 } } },
    });
    expect(analyzeEfficiency(data, "R6").direction).toBe("unknown");
  });
});
