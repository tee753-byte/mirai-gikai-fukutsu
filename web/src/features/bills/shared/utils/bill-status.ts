import type { BillStatusEnum } from "../types";

/** カード用の簡略化されたステータスラベルを取得 */
export function getCardStatusLabel(status: BillStatusEnum): string {
  switch (status) {
    case "submitted":
    case "in_committee":
    case "plenary_session":
      return "議会審議中";
    case "approved":
      return "可決";
    case "adopted":
      return "採択";
    case "partially_adopted":
      return "一部採択";
    case "rejected":
      return "否決";
    case "reported":
      return "専決処分報告";
    default:
      return "議案上程前";
  }
}

/**
 * 議会で認められた結果か（可決・同意・認定のほか、請願の採択も含む）。
 * 会期の集計や絞り込みで「可決・同意・採択など」に数えるものの判定に使う。
 * 以前は approved だけを数えていたため、請願の採択がどこにも数えられず、
 * 集計の合計が提出件数と合わなかった（2026-11-15、外部レビューで判明）。
 * 一部採択は「認められた」とも言い切れないため含めない（「その他」に入る）。
 */
export function isPassedStatus(status: BillStatusEnum): boolean {
  return status === "approved" || status === "adopted";
}

/** バッジの色。可決＝セージグリーン／否決＝サーモンのように、議決結果を色で見分けられるようにする */
export type BillStatusVariant =
  | "billApproved"
  | "billRejected"
  | "billReviewing"
  | "billSubmitted"
  | "billNeutral";

/** ステータスに対応するBadgeのvariantを取得 */
export function getStatusVariant(status: BillStatusEnum): BillStatusVariant {
  switch (status) {
    case "approved":
    case "adopted":
    case "reported":
      return "billApproved";
    case "partially_adopted":
      // 一部採択は「通った」とも「通らなかった」とも言い切れないため中間色にする
      return "billReviewing";
    case "rejected":
      return "billRejected";
    case "in_committee":
    case "plenary_session":
      return "billReviewing";
    case "submitted":
      return "billSubmitted";
    default:
      return "billNeutral";
  }
}
