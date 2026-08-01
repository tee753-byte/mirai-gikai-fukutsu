import { Badge } from "@/components/ui/badge";
import type { BillStatusEnum } from "../../../shared/types";
import { getStatusVariant } from "../../../shared/utils/bill-status";

interface BillStatusBadgeProps {
  status: BillStatusEnum;
  /** bills.bill_type。請願は議決の言い方が違うので渡す */
  billType?: string | null;
  className?: string;
}

/**
 * 請願は市民が議会に提出するもので、議会は「可決／否決」ではなく
 * 「採択／不採択」で結論を出す。同じstatusでも言い方を変える必要がある。
 */
function getPetitionStatusLabel(status: BillStatusEnum): string | null {
  switch (status) {
    case "adopted":
    case "approved":
      return "採択";
    case "partially_adopted":
      return "趣旨採択";
    case "rejected":
      return "不採択";
    default:
      return null;
  }
}

function getCardStatusLabel(status: BillStatusEnum): string {
  switch (status) {
    case "submitted":
      return "上程済み";
    case "in_committee":
      return "委員会審査中";
    case "plenary_session":
      return "本会議採決中";
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

export function BillStatusBadge({
  status,
  billType,
  className,
}: BillStatusBadgeProps) {
  const label =
    (billType === "petition" ? getPetitionStatusLabel(status) : null) ??
    getCardStatusLabel(status);

  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {label}
    </Badge>
  );
}
