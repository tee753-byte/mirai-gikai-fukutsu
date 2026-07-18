import type { ReviewMajor, ReviewMinor } from "../../shared/types/jimu-jigyo";
import {
  reviewBadgeTokens,
  reviewLabel,
} from "../../shared/utils/review-category";

type Props = {
  major: ReviewMajor | null;
  minor: ReviewMinor | null;
  size?: "sm" | "md";
};

/** 見直し区分バッジ（区分ごとに配色） */
export function ReviewCategoryBadge({ major, minor, size = "sm" }: Props) {
  const { bg, text } = reviewBadgeTokens(minor);
  const pad = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full font-medium ${pad} ${bg} ${text}`}
    >
      {reviewLabel(major, minor)}
    </span>
  );
}
