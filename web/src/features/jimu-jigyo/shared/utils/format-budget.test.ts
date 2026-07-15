import { describe, expect, it } from "vitest";
import { formatBudget } from "./format-budget";

describe("formatBudget", () => {
  it("1億円以上は億円（小数1桁）", () => {
    // 実データ: 子ども医療対策事業 6,930,000千円
    expect(formatBudget(6_930_000)).toBe("69.3億円");
    expect(formatBudget(100_000)).toBe("1.0億円");
  });

  it("1万円以上1億円未満は万円（カンマ区切り）", () => {
    // 実データ: 宿泊税導入対策事業 3,163千円
    expect(formatBudget(3_163)).toBe("316万円");
    expect(formatBudget(10)).toBe("1万円");
    expect(formatBudget(99_999)).toBe("10,000万円");
  });

  it("1万円未満は千円", () => {
    expect(formatBudget(9)).toBe("9千円");
    expect(formatBudget(0)).toBe("0千円");
  });

  it("単位の境界", () => {
    expect(formatBudget(9)).toBe("9千円"); // 万円の境界の直前
    expect(formatBudget(10)).toBe("1万円"); // 万円の境界
    expect(formatBudget(99_999)).toBe("10,000万円"); // 億円の境界の直前
    expect(formatBudget(100_000)).toBe("1.0億円"); // 億円の境界
  });

  it("四捨五入される", () => {
    expect(formatBudget(14)).toBe("1万円"); // 1.4万 → 1万
    expect(formatBudget(15)).toBe("2万円"); // 1.5万 → 2万
    expect(formatBudget(105_000)).toBe("1.1億円"); // 1.05億 → 1.1億
  });
});
