import { Badge } from "@/components/ui/badge";
import type { BillStatusEnum } from "../../../shared/types";
import { getStatusVariant } from "../../../shared/utils/bill-status";

interface BillStatusBadgeProps {
  status: BillStatusEnum;
  className?: string;
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

export function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {getCardStatusLabel(status)}
    </Badge>
  );
}
