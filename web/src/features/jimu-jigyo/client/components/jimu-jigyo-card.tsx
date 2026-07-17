import Link from "next/link";
import type { JimuJigyoRecord } from "../../shared/types/jimu-jigyo";
import { getInitial } from "../../shared/utils/budget-accessor";
import { formatBudget } from "../../shared/utils/format-budget";
import { DirectionBadge } from "./direction-badge";
import { ReviewCategoryBadge } from "./review-category-badge";

type Props = {
  record: JimuJigyoRecord;
  basePath: string;
  /** 当年度当初予算の年度（例: "r7"）。一覧の並び順の根拠として金額を表示する */
  budgetYear: string;
};

export function JimuJigyoCard({ record, basePath, budgetYear }: Props) {
  const { analysis } = record;
  const budget = getInitial(record, budgetYear);
  return (
    <Link href={`${basePath}/${record.id}`} className="block group">
      <div className="bg-card rounded-lg border border-mirai-border shadow-sm hover:shadow-md transition-shadow p-4 h-full flex flex-col gap-3">
        {/*
          バッジは左寄せで並べて折り返す（市版の流儀）。
          justify-between で左右に対峙させると、県の長い部局名
          （例: 人づくり・県民生活部スポーツ局）と区分バッジがカード幅の中で
          押し合い、横方向が窮屈に見える。
        */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-mirai-surface-warm text-mirai-text-secondary border border-mirai-border">
            {record.部局}
          </span>
          <ReviewCategoryBadge
            major={record.見直し.大区分}
            minor={record.見直し.小区分}
          />
        </div>

        <div>
          <h3 className="text-sm font-bold text-mirai-text line-clamp-2 group-hover:underline">
            {record.事業名}
          </h3>
          <p className="text-xs text-mirai-text-muted mt-0.5">
            {record.課室}
            {record.事業開始年度 && ` · ${record.事業開始年度}開始`}
          </p>
        </div>

        {budget !== null && (
          <p className="text-sm font-bold text-mirai-text">
            {formatBudget(budget)}
            <span className="ml-1 text-xs font-normal text-mirai-text-muted">
              （{budgetYear.toUpperCase()}当初予算）
            </span>
          </p>
        )}

        <div className="space-y-1 border-t border-mirai-border pt-2">
          <DirectionBadge
            label="KPI"
            direction={analysis.kpi.direction}
            changeRate={analysis.kpi.changeRate}
          />
          <DirectionBadge
            label="予算"
            direction={analysis.budget.direction}
            changeRate={analysis.budget.changeRate}
            sub={
              analysis.budget.settlementDirection !== "unknown"
                ? {
                    label: "決算",
                    direction: analysis.budget.settlementDirection,
                    changeRate: analysis.budget.settlementChangeRate,
                  }
                : undefined
            }
          />
          <DirectionBadge
            label="効率"
            direction={analysis.efficiency.direction}
            changeRate={analysis.efficiency.changeRate}
          />
        </div>

        <div className="mt-auto text-xs text-primary font-medium">
          詳細を見る →
        </div>
      </div>
    </Link>
  );
}
