import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { EXPENDITURE_SOURCE_URL } from "../../shared/expenditure-r8";

/**
 * 主要事業の4分類が何なのかを説明する注記。
 *
 * 「1．災害に強く…」から「4．その他」という分け方は、原本の目次をそのまま
 * 使っている。ただし何の分類かを書かないと、いきなり見出しだけが現れて
 * 読み手には意味が分からない。実際にはこの1〜3が、市が令和8年度の市政運営で
 * 掲げた「3つの柱」にあたる。
 *
 * 出典: 福津市「令和8年度 市政運営の指針・予算の編成」
 *   「特に『災害に強く、安心して暮らせるまちづくり』『次世代を育む教育環境の整備』
 *    『人も企業も行政も「稼ぐ」まちづくり』、この3つの柱を緊急性と重要性が高い
 *    施策として、市の力を集中して取り組んでまいります」
 */
export function BudgetGroupingNote() {
  return (
    <div className="mb-4 rounded-lg bg-mirai-surface-grouped px-4 py-3">
      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-mirai-text-secondary">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          下の1〜3は、市が令和8年度の市政運営で掲げた
          <strong className="font-bold text-mirai-text">「3つの柱」</strong>
          です。市は「緊急性と重要性が高い施策として、市の力を集中して取り組む」と説明しています。4は、その3つ以外の主な事業です。
        </span>
      </p>
      <Link
        href={EXPENDITURE_SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs text-mirai-text-muted hover:text-mirai-text"
      >
        <ExternalLink className="h-3 w-3 shrink-0" />
        出典：福津市「令和8年度 市政運営の指針・予算の編成」
      </Link>
    </div>
  );
}
