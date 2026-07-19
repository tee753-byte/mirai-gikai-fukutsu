/** 委員会スラッグ → 種別の対応（DBには常任委以外の種別がないため静的に持つ） */
const COMMITTEE_TYPE_BY_SLUG: Record<string, CommitteeTypeLabel> = {
  "somu-kikaku-chiiki": "常任委員会",
  "kosei-kankyo": "常任委員会",
  "shoko-rodo": "常任委員会",
  "norin-suisan": "常任委員会",
  "kendo-seibi": "常任委員会",
  "kenchiku-toshi": "常任委員会",
  bunkyo: "常任委員会",
  keisatsu: "常任委員会",
  "gikai-unei": "議会運営委員会",
  "kuko-kotsu-infra": "特別委員会",
  "kosodate-jinzai": "特別委員会",
  "saisei-energy": "特別委員会",
  "kokusaika-tabunka": "特別委員会",
  "one-health-chihobunken": "特別委員会",
  "sports-rikken": "特別委員会",
  yosan: "予算・決算",
  kessan: "予算・決算",
};

export type CommitteeTypeLabel =
  | "常任委員会"
  | "特別委員会"
  | "予算・決算"
  | "議会運営委員会";

/** 一覧ページでのグループ表示順 */
export const COMMITTEE_TYPE_ORDER: CommitteeTypeLabel[] = [
  "常任委員会",
  "特別委員会",
  "予算・決算",
  "議会運営委員会",
];

export function getCommitteeTypeLabel(slug: string): CommitteeTypeLabel {
  return COMMITTEE_TYPE_BY_SLUG[slug] ?? "常任委員会";
}
