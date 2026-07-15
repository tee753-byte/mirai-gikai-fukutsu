import type { ReviewMajor, ReviewMinor } from "../types/jimu-jigyo";

// 見直し区分（継続〔拡充/改善/一部改善/縮小〕・終了〔完了/再構築/廃止〕）の
// パース・フィルタslug変換・バッジ配色を扱う純粋関数群。

export const REVIEW_MAJORS: ReviewMajor[] = ["継続", "終了"];

export const REVIEW_MINORS_BY_MAJOR: Record<ReviewMajor, ReviewMinor[]> = {
  継続: ["拡充", "改善", "一部改善", "縮小"],
  終了: ["完了", "再構築", "廃止"],
};

// 大区分のフィルタslug
const MAJOR_SLUG: Record<ReviewMajor, string> = {
  継続: "keizoku",
  終了: "shuryo",
};
const MAJOR_SLUG_REVERSE: Record<string, ReviewMajor> = {
  keizoku: "継続",
  shuryo: "終了",
};

// 小区分のフィルタslug
const MINOR_SLUG: Record<ReviewMinor, string> = {
  拡充: "kakuju",
  改善: "kaizen",
  一部改善: "ichibu-kaizen",
  縮小: "shukusho",
  完了: "kanryo",
  再構築: "saikochiku",
  廃止: "haishi",
};
const MINOR_SLUG_REVERSE: Record<string, ReviewMinor> = Object.fromEntries(
  Object.entries(MINOR_SLUG).map(([k, v]) => [v, k as ReviewMinor])
) as Record<string, ReviewMinor>;

/** 大区分 → slug（"継続" → "keizoku"） */
export function majorToSlug(major: ReviewMajor): string {
  return MAJOR_SLUG[major];
}

/** 小区分 → slug（"拡充" → "kakuju"） */
export function minorToSlug(minor: ReviewMinor): string {
  return MINOR_SLUG[minor];
}

export type ParsedCategorySlug =
  | { major: ReviewMajor; minor: null }
  | { major: ReviewMajor; minor: ReviewMinor }
  | null;

/**
 * category クエリ（"keizoku" / "keizoku-kakuju" / "shuryo-haishi"）を
 * 大区分・小区分に分解する。不正な値は null。
 */
export function parseCategorySlug(
  slug: string | undefined
): ParsedCategorySlug {
  if (!slug) return null;
  // 小区分は "ichibu-kaizen" のようにハイフンを含むため、大区分プレフィックスで判定
  for (const [majorSlug, major] of Object.entries(MAJOR_SLUG_REVERSE)) {
    if (slug === majorSlug) return { major, minor: null };
    const prefix = `${majorSlug}-`;
    if (slug.startsWith(prefix)) {
      const minor = MINOR_SLUG_REVERSE[slug.slice(prefix.length)];
      if (minor && REVIEW_MINORS_BY_MAJOR[major].includes(minor)) {
        return { major, minor };
      }
      return null;
    }
  }
  return null;
}

/** 大区分・小区分から category slug を組み立てる */
export function buildCategorySlug(
  major: ReviewMajor,
  minor?: ReviewMinor | null
): string {
  return minor
    ? `${MAJOR_SLUG[major]}-${MINOR_SLUG[minor]}`
    : MAJOR_SLUG[major];
}

/** バッジ用のカラートークン名（globals.css の --color-review-* に対応） */
export function reviewBadgeTokens(minor: ReviewMinor | null): {
  bg: string;
  text: string;
} {
  switch (minor) {
    case "拡充":
      return { bg: "bg-review-kakuju-bg", text: "text-review-kakuju-text" };
    case "改善":
    case "一部改善":
      return { bg: "bg-review-kaizen-bg", text: "text-review-kaizen-text" };
    case "縮小":
      return { bg: "bg-review-shukusho-bg", text: "text-review-shukusho-text" };
    case "完了":
      return { bg: "bg-review-kanryo-bg", text: "text-review-kanryo-text" };
    case "再構築":
      return {
        bg: "bg-review-saikochiku-bg",
        text: "text-review-saikochiku-text",
      };
    case "廃止":
      return { bg: "bg-review-haishi-bg", text: "text-review-haishi-text" };
    default:
      return {
        bg: "bg-mirai-surface-muted",
        text: "text-mirai-text-secondary",
      };
  }
}

/** 表示ラベル（"継続（一部改善）"） */
export function reviewLabel(
  major: ReviewMajor | null,
  minor: ReviewMinor | null
): string {
  if (!major) return "―";
  return minor ? `${major}（${minor}）` : major;
}
