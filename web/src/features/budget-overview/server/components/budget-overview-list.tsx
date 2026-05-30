import "server-only";
import Link from "next/link";
import type { BudgetOverview } from "../../shared/types";

type BudgetOverviewListProps = {
  overviews: BudgetOverview[];
  sessionSlug: string;
  showDirection?: boolean;
};

export function BudgetOverviewList({
  overviews,
  sessionSlug,
  showDirection = true,
}: BudgetOverviewListProps) {
  if (overviews.length === 0) {
    return (
      <p className="text-mirai-text-muted text-center py-10">
        公開中の予算概要はありません。
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {overviews.map((overview) => (
        <li key={overview.id}>
          <Link
            href={`/budget/${sessionSlug}/${overview.department_slug}`}
            className="block bg-card rounded-lg border border-border p-5 hover:border-primary transition-colors"
          >
            <h2 className="font-bold text-mirai-text text-lg leading-snug">
              {overview.department_name}
            </h2>

            {showDirection && overview.direction && (
              <p className="mt-2 text-sm text-mirai-text-secondary line-clamp-2">
                {overview.direction}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
