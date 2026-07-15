import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { YEAR_METADATA } from "@/features/jimu-jigyo/server/loaders/load-jimu-jigyo-list";

export function JimuJigyoArchiveSection() {
  const latest = YEAR_METADATA[0];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-bold text-black leading-[1.48]">
          事務事業評価
        </h2>
        <p className="text-xs text-mirai-text-secondary">
          県が実施する事業の見直し区分・KPI・予算・効率の動向を年度ごとに分析します
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-mirai-border">
        {YEAR_METADATA.map((y) => (
          <li key={y.slug}>
            <Link
              href={`/jimu-jigyo/${y.slug}`}
              className="flex items-center justify-between py-4 px-2 hover:bg-mirai-surface-grouped rounded-lg transition-colors group"
            >
              <span className="font-bold text-mirai-text text-base">
                {y.label}
              </span>
              <ChevronRight className="h-5 w-5 text-mirai-text-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex justify-center">
        <Button variant="outline" size="lg" asChild className="rounded-full">
          <Link href={`/jimu-jigyo/${latest.slug}`}>
            事務事業評価を一覧で表示
          </Link>
        </Button>
      </div>
    </div>
  );
}
