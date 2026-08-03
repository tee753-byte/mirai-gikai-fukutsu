import { describe, expect, it } from "vitest";
import {
  findRelatedBillGroup,
  othersInGroup,
  RELATED_BILL_GROUPS,
} from "./related-bill-groups";

describe("findRelatedBillGroup", () => {
  it("グループに入っている議案からグループを引ける", () => {
    const group = findRelatedBillGroup({
      sessionSlug: "r8-6",
      billNumber: "議案第49号",
    });

    expect(group).not.toBeNull();
    expect(group?.bills.map((b) => b.sessionSlug)).toContain("r8-3");
  });

  it("会期が違えば別の議案として扱う", () => {
    // 議案番号は会期ごとに振り直されるので、番号だけでは一致とみなせない
    expect(
      findRelatedBillGroup({ sessionSlug: "r7-6", billNumber: "議案第49号" })
    ).toBeNull();
  });

  it("関連づけていない議案は null", () => {
    expect(
      findRelatedBillGroup({ sessionSlug: "r8-6", billNumber: "議案第52号" })
    ).toBeNull();
  });
});

describe("othersInGroup", () => {
  it("自分自身は含めない", () => {
    const self = { sessionSlug: "r8-3", billNumber: "議案第16号" };
    const group = findRelatedBillGroup(self);
    if (!group) throw new Error("グループが見つかりません");

    const others = othersInGroup(group, self);

    expect(others).toEqual([{ sessionSlug: "r8-6", billNumber: "議案第49号" }]);
  });
});

describe("RELATED_BILL_GROUPS", () => {
  it("同じ議案が複数のグループに入っていない", () => {
    // 複数に入ると、どちらのグループを出すかが定義から読み取れなくなる
    const seen = new Set<string>();
    for (const group of RELATED_BILL_GROUPS) {
      for (const bill of group.bills) {
        const key = `${bill.sessionSlug}/${bill.billNumber}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it("1件だけのグループを作らない", () => {
    // 相手がいないグループは、節が出ないだけで意味がない
    for (const group of RELATED_BILL_GROUPS) {
      expect(group.bills.length).toBeGreaterThanOrEqual(2);
    }
  });
});
