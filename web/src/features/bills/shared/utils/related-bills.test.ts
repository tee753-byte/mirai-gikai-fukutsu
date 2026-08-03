import { describe, expect, it } from "vitest";
import { toRelatedBills } from "./related-bills";

const session = (name: string, endDate: string | null) => ({
  name,
  end_date: endDate,
});

describe("toRelatedBills", () => {
  it("新しい会期が先に来る", () => {
    // 市長の給与減額の議案は、否決されたあと次の会期でまた出されている。
    // 何度目の提出なのかが分かるよう、時系列の逆順に並べる
    const result = toRelatedBills([
      {
        id: "b1",
        bill_number: "議案第45号",
        status: "rejected",
        council_sessions: session("令和7年 12月定例会", "2025-12-11"),
      },
      {
        id: "b2",
        bill_number: "議案第49号",
        status: "rejected",
        council_sessions: session("令和8年 6月定例会", "2026-06-23"),
      },
      {
        id: "b3",
        bill_number: "議案第16号",
        status: "rejected",
        council_sessions: session("令和8年 3月定例会", "2026-03-24"),
      },
    ]);

    expect(result.map((b) => b.billNumber)).toEqual([
      "議案第49号",
      "議案第16号",
      "議案第45号",
    ]);
  });

  it("会期に紐づいていない議案は出さない", () => {
    // いつ提出されたものか示せないと、繰り返し出されていることが伝わらない
    const result = toRelatedBills([
      {
        id: "b1",
        bill_number: "議案第45号",
        status: "rejected",
        council_sessions: null,
      },
      {
        id: "b2",
        bill_number: "議案第16号",
        status: "rejected",
        council_sessions: session("令和8年 3月定例会", "2026-03-24"),
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].billNumber).toBe("議案第16号");
  });

  it("council_sessions が配列で返ってきても扱える", () => {
    const result = toRelatedBills([
      {
        id: "b1",
        bill_number: "発議第8号",
        status: "approved",
        council_sessions: [session("令和7年 12月定例会", "2025-12-11")],
      },
    ]);

    expect(result[0].sessionName).toBe("令和7年 12月定例会");
  });

  it("終了日が無い会期は最後に回す", () => {
    const result = toRelatedBills([
      {
        id: "b1",
        bill_number: "議案第1号",
        status: "approved",
        council_sessions: session("日付未設定の会期", null),
      },
      {
        id: "b2",
        bill_number: "議案第16号",
        status: "rejected",
        council_sessions: session("令和8年 3月定例会", "2026-03-24"),
      },
    ]);

    expect(result.map((b) => b.billNumber)).toEqual([
      "議案第16号",
      "議案第1号",
    ]);
  });

  it("同じ件名の議案が無ければ空のまま返す", () => {
    expect(toRelatedBills([])).toEqual([]);
  });
});
