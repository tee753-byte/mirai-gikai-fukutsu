import { describe, expect, it } from "vitest";
import { getCardStatusLabel, getStatusVariant } from "./bill-status";

describe("getCardStatusLabel", () => {
  it.each([
    ["submitted", "議会審議中"],
    ["in_committee", "議会審議中"],
    ["plenary_session", "議会審議中"],
  ] as const)("審議中ステータス %s → %s", (status, expected) => {
    expect(getCardStatusLabel(status)).toBe(expected);
  });

  it("approved → 可決", () => {
    expect(getCardStatusLabel("approved")).toBe("可決");
  });

  it("rejected → 否決", () => {
    expect(getCardStatusLabel("rejected")).toBe("否決");
  });

  it("preparing → 議案上程前", () => {
    expect(getCardStatusLabel("preparing")).toBe("議案上程前");
  });
});

describe("getStatusVariant", () => {
  it.each([
    ["in_committee", "billReviewing"],
    ["plenary_session", "billReviewing"],
  ] as const)("審議中ステータス %s → %s", (status, expected) => {
    expect(getStatusVariant(status)).toBe(expected);
  });

  it("submitted → billSubmitted", () => {
    expect(getStatusVariant("submitted")).toBe("billSubmitted");
  });

  // 可決・採択・専決処分報告はどれも「議会を通った」結果なので同じ色にする
  it.each([
    "approved",
    "adopted",
    "reported",
  ] as const)("可決系 %s → billApproved", (status) => {
    expect(getStatusVariant(status)).toBe("billApproved");
  });

  it("rejected → billRejected", () => {
    expect(getStatusVariant("rejected")).toBe("billRejected");
  });

  it("partially_adopted → billReviewing", () => {
    expect(getStatusVariant("partially_adopted")).toBe("billReviewing");
  });

  it("preparing → billNeutral", () => {
    expect(getStatusVariant("preparing")).toBe("billNeutral");
  });

  it("可決と否決は別の色になる", () => {
    expect(getStatusVariant("approved")).not.toBe(getStatusVariant("rejected"));
  });
});
