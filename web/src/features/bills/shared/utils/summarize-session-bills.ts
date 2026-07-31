import type { BillWithContent } from "../types";

export type SessionBillSummary = {
  total: number;
  approved: number;
  rejected: number;
  other: number;
  /** 賛成・反対どちらも1人以上いる議案（全会一致でない議案） */
  splitVoteBills: BillWithContent[];
};

/**
 * 会期の議案から集計を作る。可決・否決・賛否が分かれた案件の件数を出す。
 * `voteCounts` が無い議案（会議録が起立採決で議員個人の賛否が分からないもの）は
 * 「賛否が分かれた案件」の集計対象から自然に外れる。
 */
export function summarizeSessionBills(
  bills: BillWithContent[]
): SessionBillSummary {
  const approved = bills.filter((b) => b.status === "approved").length;
  const rejected = bills.filter((b) => b.status === "rejected").length;
  const other = bills.length - approved - rejected;
  const splitVoteBills = bills.filter(
    (b) => b.voteCounts && b.voteCounts.for > 0 && b.voteCounts.against > 0
  );

  return { total: bills.length, approved, rejected, other, splitVoteBills };
}
