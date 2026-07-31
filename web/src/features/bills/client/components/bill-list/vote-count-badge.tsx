import { Badge } from "@/components/ui/badge";
import {
  isUnanimousVote,
  type VoteCounts,
} from "../../../shared/utils/vote-counts";

interface VoteCountBadgeProps {
  voteCounts: VoteCounts;
  className?: string;
}

/** 議員別の賛否データがある議案だけ、議案カードに賛成・反対の人数を表示する */
export function VoteCountBadge({ voteCounts, className }: VoteCountBadgeProps) {
  return (
    <Badge variant="outline" className={className ?? "w-fit"}>
      {isUnanimousVote(voteCounts)
        ? "全会一致"
        : `賛成${voteCounts.for}・反対${voteCounts.against}`}
    </Badge>
  );
}
