export type CommitteeReportQa = {
  question: string;
  answer: string;
};

export type CommitteeReportBillReview = {
  billNumber: string;
  billTitle: string;
  /** 主な質疑及び答弁（原本の「(1)主な質疑及び答弁」より抜粋） */
  qa: CommitteeReportQa[];
  /** 主な意見（反対討論など。無ければ空配列） */
  opinions: string[];
  /** 審査結果（例:「賛成多数により原案のとおり可決すべきものと決定した。」） */
  result: string;
  outcome: "approved" | "rejected";
};

export type CommitteeReportGroup = {
  committeeName: string;
  /** 審査年月日 */
  reviewedAt: string;
  sourceUrl: string;
  reviews: CommitteeReportBillReview[];
};
