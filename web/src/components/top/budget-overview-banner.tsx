import Link from "next/link";
import { ArrowRight, BarChart2 } from "lucide-react";

type BudgetOverviewBannerProps = {
  sessionSlug: string;
};

export function BudgetOverviewBanner({
  sessionSlug,
}: BudgetOverviewBannerProps) {
  return (
    <Link
      href={`/budget/${sessionSlug}`}
      className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start gap-3">
        <BarChart2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-mirai-text">予算</p>
          <p className="mt-0.5 text-sm text-mirai-text-secondary">
            予算の方向性と主要事業をわかりやすく解説します
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-mirai-text-muted shrink-0" />
    </Link>
  );
}
