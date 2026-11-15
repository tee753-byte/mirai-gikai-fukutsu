import { describe, expect, it } from "vitest";
import type { BillWithContent } from "../types";
import { summarizeSessionBills } from "./summarize-session-bills";

function bill(status: BillWithContent["status"]): BillWithContent {
  return { id: status, status } as unknown as BillWithContent;
}

describe("summarizeSessionBills", () => {
  it("請願の採択も「可決・同意・採択など」に数え、合計が提出件数と合う", () => {
    // 令和8年9月定例会と同じ形：可決・同意など27件＋請願の採択1件
    const bills = [
      ...Array.from({ length: 27 }, () => bill("approved")),
      bill("adopted"),
    ];
    const summary = summarizeSessionBills(bills);
    expect(summary.total).toBe(28);
    expect(summary.approved).toBe(28);
    expect(summary.rejected).toBe(0);
    expect(summary.other).toBe(0);
  });

  it("一部採択は「その他」に入る", () => {
    const summary = summarizeSessionBills([
      bill("partially_adopted"),
      bill("rejected"),
    ]);
    expect(summary.approved).toBe(0);
    expect(summary.rejected).toBe(1);
    expect(summary.other).toBe(1);
  });
});
