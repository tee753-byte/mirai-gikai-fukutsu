import { ArrowRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { YEAR_METADATA } from "@/features/jimu-jigyo/server/loaders/load-jimu-jigyo-list";

export function JimuJigyoBanner() {
  const latest = YEAR_METADATA[0];
  return (
    <Link
      href={`/jimu-jigyo/${latest.slug}`}
      className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start gap-3">
        <ClipboardList className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-mirai-text">事務事業評価</p>
          <p className="mt-0.5 text-sm text-mirai-text-secondary">
            県の事業の見直し区分・KPI・予算・効率の動向を分析します
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-mirai-text-muted shrink-0" />
    </Link>
  );
}
