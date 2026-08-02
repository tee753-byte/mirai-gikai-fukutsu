import "server-only";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatYen } from "../../shared/format-yen";
import type { BudgetOverview } from "../../shared/types";

type BudgetOverviewListProps = {
  overviews: BudgetOverview[];
  sessionSlug: string;
};

/**
 * その年度の予算資料への入口。
 *
 * 以前は小さなカードを2列で並べていたため、掲載が1件だと画面の端に
 * 小さく置かれ、歳出グラフの下に埋もれて気づかれにくかった。
 * 件数が少ないうちは横幅いっぱいに出して、総額と「見る」導線を添える。
 */
export function BudgetOverviewList({
  overviews,
  sessionSlug,
}: BudgetOverviewListProps) {
  if (overviews.length === 0) {
    return (
      <p className="text-mirai-text-muted text-center py-10">
        公開中の予算概要はありません。
      </p>
    );
  }

  // 3件以上になったら従来どおり2列に並べる
  const isCompact = overviews.length > 2;

  return (
    <ul className={`grid gap-4 ${isCompact ? "sm:grid-cols-2" : ""}`}>
      {overviews.map((overview) => (
        <li key={overview.id}>
          <Link
            href={`/budget/${sessionSlug}/${overview.department_slug}`}
            className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold leading-snug text-mirai-text">
                {overview.department_name}
              </h3>
              {overview.total_budget !== null && (
                <p className="shrink-0 text-right text-sm font-bold text-mirai-text tabular-nums">
                  {formatYen(overview.total_budget)}
                </p>
              )}
            </div>

            {overview.direction && (
              <p
                className={`mt-2 text-sm leading-relaxed text-mirai-text-secondary ${
                  isCompact ? "line-clamp-2" : "line-clamp-3"
                }`}
              >
                {overview.direction}
              </p>
            )}

            <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary-accent">
              事業の一覧を見る
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
