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
  it("決算YoY増＋次年度当初方向も算出", () => {
    const data = base({
      事業費: {
        年度別: {
          R5決算: { 歳出: 1000 },
          R6決算: { 歳出: 1200 },
          R7当初: { 歳出: 1300 },
          R8当初: { 歳出: 1000 },
        },
      },
    });
    const r = analyzeBudget(data, "R6");
    expect(r.direction).toBe("up");
    expect(r.changeRate).toBeCloseTo(0.2);
    expect(r.nextYearDirection).toBe("down"); // 当初 1300→1000
    expect(r.nextYearChangeRate).toBeCloseTo(-0.2307, 2);
  });

  it("前年度決算がなければ direction は unknown でも次年度方向は出る", () => {
    const data = base({
      事業費: {
        年度別: {
          R6決算: { 歳出: 1200 },
          R7当初: { 歳出: 1300 },
          R8当初: { 歳出: 1400 },
        },
      },
    });
    const r = analyzeBudget(data, "R6");
    expect(r.direction).toBe("unknown");
    expect(r.nextYearDirection).toBe("up");
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
