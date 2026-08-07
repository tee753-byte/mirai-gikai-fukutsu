import Link from "next/link";
import type { BillTag as BillTagType } from "../../../shared/types";

interface BillTagProps {
  tag: BillTagType;
  /**
   * true にすると、そのタグで絞り込んだ検索ページへのリンクになる。
   *
   * 既定は false（ただの文字）。議案カードはカード全体がリンクに
   * なっているため、その中にリンクを入れると入れ子になってしまい、
   * HTMLとして正しくないうえクリックの動きも壊れる。
   * リンクにしてよいのは、カードの外にあるタグだけ。
   */
  linkToSearch?: boolean;
}

const CLASS_NAME =
  "inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-black bg-mirai-surface-tag rounded-full";

export function BillTag({ tag, linkToSearch = false }: BillTagProps) {
  if (linkToSearch) {
    return (
      <Link
        href={`/search?tag=${encodeURIComponent(tag.label)}`}
        className={`${CLASS_NAME} hover:opacity-70 transition-opacity`}
      >
        {tag.label}
      </Link>
    );
  }

  return <span className={CLASS_NAME}>{tag.label}</span>;
}
