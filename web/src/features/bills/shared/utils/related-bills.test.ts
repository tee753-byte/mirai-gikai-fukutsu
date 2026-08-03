import { describe, expect, it } from "vitest";
import { toRelatedBills } from "./related-bills";

const session = (name: string, slug: string, endDate: string | null) => ({
  name,
  slug,
  end_date: endDate,
});

describe("toRelatedBills", () => {
  it("新しい会期が先に来る", () => {
    // 市長の給料を減らす議案は、否決されたあと次の会期でまた出されている。
    // 何度目の提出なのかが分かるよう、時系列の逆順に並べる
    const result = toRelatedBills(
      [
        {
          id: "b1",
          bill_number: "議案第16号",
          status: "rejected",
          council_sessions: session("令和8年 3月定例会", "r8-3", "2026-03-24"),
        },
        {
          id: "b2",
          bill_number: "議案第49号",
          status: "rejected",
          council_sessions: session("令和8年 6月定例会", "r8-6", "2026-06-23"),
        },
      ],
      [
        { sessionSlug: "r8-3", billNumber: "議案第16号" },
        { sessionSlug: "r8-6", billNumber: "議案第49号" },
      ]
    );

    expect(result.map((b) => b.billNumber)).toEqual([
      "議案第49号",
      "議案第16号",
    ]);
  });

  it("指定していない会期の同じ議案番号は混ぜない", () => {
    // 議案番号は会期ごとに振り直されるため、番号だけで引くと別の会期の
    // 無関係な議案が入ってくる
    const result = toRelatedBills(
      [
        {
          id: "b1",
          bill_number: "議案第16号",
          status: "rejected",
          council_sessions: session("令和8年 3月定例会", "r8-3", "2026-03-24"),
        },
        {
          id: "b2",
          bill_number: "議案第16号",
          status: "approved",
          council_sessions: session("令和7年 6月定例会", "r7-6", "2025-06-20"),
        },
      ],
      [{ sessionSlug: "r8-3", billNumber: "議案第16号" }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b1");
  });

  it("会期に紐づいていない議案は出さない", () => {
    // いつ提出されたものか示せないと、繰り返し出されていることが伝わらない
    const result = toRelatedBills(
      [
        {
          id: "b1",
          bill_number: "議案第16号",
          status: "rejected",
          council_sessions: null,
        },
      ],
      [{ sessionSlug: "r8-3", billNumber: "議案第16号" }]
    );

    expect(result).toEqual([]);
  });

  it("council_sessions が配列で返ってきても扱える", () => {
    const result = toRelatedBills(
      [
        {
          id: "b1",
          bill_number: "議案第49号",
          status: "rejected",
          council_sessions: [
            session("令和8年 6月定例会", "r8-6", "2026-06-23"),
          ],
        },
      ],
      [{ sessionSlug: "r8-6", billNumber: "議案第49号" }]
    );

    expect(result[0].sessionName).toBe("令和8年 6月定例会");
  });

  it("終了日が無い会期は最後に回す", () => {
    const result = toRelatedBills(
      [
        {
          id: "b1",
          bill_number: "議案第1号",
          status: "approved",
          council_sessions: session("日付未設定の会期", "unknown", null),
        },
        {
          id: "b2",
          bill_number: "議案第16号",
          status: "rejected",
          council_sessions: session("令和8年 3月定例会", "r8-3", "2026-03-24"),
        },
      ],
      [
        { sessionSlug: "unknown", billNumber: "議案第1号" },
        { sessionSlug: "r8-3", billNumber: "議案第16号" },
      ]
    );

    expect(result.map((b) => b.billNumber)).toEqual([
      "議案第16号",
      "議案第1号",
    ]);
  });

  it("何も指定しなければ空のまま返す", () => {
    expect(toRelatedBills([], [])).toEqual([]);
  });
});
