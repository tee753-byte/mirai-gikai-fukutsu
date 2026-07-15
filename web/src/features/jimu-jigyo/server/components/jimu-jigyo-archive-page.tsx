import "server-only";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { YEAR_METADATA } from "../loaders/load-jimu-jigyo-list";

/** 年度アーカイブ（/jimu-jigyo） */
export function JimuJigyoArchivePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mirai-text">事務事業評価</h1>
        <p className="text-sm text-mirai-text-secondary mt-1">
          福岡県の行政評価（事務事業評価）をもとに、各事業の見直し区分・KPI・予算・効率の動向を可視化します。
        </p>
      </div>
      <ul className="space-y-2">
        {YEAR_METADATA.map((y) => (
          <li key={y.slug}>
            <Link
              href={`/jimu-jigyo/${y.slug}`}
              className="flex items-center justify-between gap-3 p-4 bg-card border border-mirai-border rounded-lg hover:border-mirai-text transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-mirai-text">{y.label}</p>
                <p className="text-xs text-mirai-text-muted">{y.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-mirai-text-muted shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
