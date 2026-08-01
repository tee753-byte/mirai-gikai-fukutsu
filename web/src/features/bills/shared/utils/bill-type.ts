/**
 * 議案の種別（bills.bill_type）を、市民向けの呼び方と色に対応づける。
 *
 * 一覧に議案・発議・請願が混ざって並ぶため、「誰が出したものか」が
 * ひと目で分かるようにする。議決結果のバッジ（可決・否決など）とは
 * 役割が違うので、色の系統も分けている。
 */

export type BillTypeKey =
  | "bill"
  | "member_bill"
  | "petition"
  | "opinion"
  | "resolution";

export type BillTypeMeta = {
  /** バッジに出す短い呼び方 */
  label: string;
  /** 誰が提出したものかの説明 */
  description: string;
  /** 淡い地色。帯やバッジの背景に使う */
  bgClass: string;
  /** 地色より少し濃い線。白いカードの上でも境目が分かるようにする */
  borderClass: string;
  /** 地色と同系の濃い文字色 */
  textClass: string;
};

const BILL_TYPES: Record<BillTypeKey, BillTypeMeta> = {
  bill: {
    label: "議案",
    description: "市長（市）が提出したもの",
    bgClass: "bg-bill-type-bill-bg",
    borderClass: "border-bill-type-bill-border",
    textClass: "text-bill-type-bill-text",
  },
  member_bill: {
    label: "発議",
    description: "議員が提出したもの",
    bgClass: "bg-bill-type-member-bg",
    borderClass: "border-bill-type-member-border",
    textClass: "text-bill-type-member-text",
  },
  petition: {
    label: "請願",
    description: "市民が提出したもの",
    bgClass: "bg-bill-type-petition-bg",
    borderClass: "border-bill-type-petition-border",
    textClass: "text-bill-type-petition-text",
  },
  opinion: {
    label: "意見書",
    description: "議会から国や県などへ意見を出すもの",
    bgClass: "bg-bill-type-opinion-bg",
    borderClass: "border-bill-type-opinion-border",
    textClass: "text-bill-type-opinion-text",
  },
  resolution: {
    label: "決議",
    description: "議会としての意思を示すもの",
    bgClass: "bg-bill-type-other-bg",
    borderClass: "border-bill-type-other-border",
    textClass: "text-bill-type-other-text",
  },
};

/** 未知の値が来ても画面が壊れないよう、既定は「議案」にする */
export function getBillTypeMeta(billType: string | null | undefined) {
  return BILL_TYPES[(billType ?? "bill") as BillTypeKey] ?? BILL_TYPES.bill;
}

/** 凡例と検索の絞り込みで使う並び。掲載実績のある種別だけを載せる */
export const BILL_TYPE_ORDER: BillTypeKey[] = [
  "bill",
  "member_bill",
  "petition",
  "opinion",
];
