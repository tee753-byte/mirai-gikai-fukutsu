import type { BillTag } from "../types";

// タグに対応するデフォルトのサムネイル画像（フリー素材）。
// bills.thumbnail_url が未設定の議案カードで、タグの雰囲気に合わせた画像を表示するために使う。
// タグ名がDB側で変わった場合はここも合わせて更新する。
const TAG_THUMBNAIL_BY_LABEL: Record<string, string> = {
  "予算・財政": "/images/tag-thumbnails/budget-finance.jpg",
  "子育て・教育": "/images/tag-thumbnails/childcare-education.jpg",
  まちづくり: "/images/tag-thumbnails/town-development.jpg",
  "議会・行政のしくみ": "/images/tag-thumbnails/council-system.jpg",
  "意見書・決議": "/images/tag-thumbnails/opinion-resolution.jpg",
  "施設・使用料": "/images/tag-thumbnails/facility-fee.jpg",
  防災: "/images/tag-thumbnails/disaster-prevention.jpg",
};

/**
 * 議案に付いているタグから、デフォルトのサムネイル画像パスを返す。
 * 複数タグがある場合は先頭のタグを優先する。対応する画像が無ければ undefined。
 */
export function getTagThumbnail(
  tags: BillTag[] | undefined
): string | undefined {
  if (!tags) return undefined;
  for (const tag of tags) {
    const src = TAG_THUMBNAIL_BY_LABEL[tag.label];
    if (src) return src;
  }
  return undefined;
}
