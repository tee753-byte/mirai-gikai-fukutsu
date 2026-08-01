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

/** 会期ごとの委員会報告。会期が増えたらこの単位で足していく */
export type CommitteeReportSession = {
  /** 議案ページと合わせた会期のslug。例: "r8-6" */
  slug: string;
  /** 表示名。例: "令和8年6月定例会" */
  name: string;
  /** 一覧カードに出す会期の期間 */
  periodLabel: string;
  groups: CommitteeReportGroup[];
};

/** 常任委員会は3つ。付託議案が無い委員会も「報告なし」として必ず表示する */
export const STANDING_COMMITTEES = [
  "総務文教委員会",
  "市民福祉委員会",
  "建設環境委員会",
] as const;
