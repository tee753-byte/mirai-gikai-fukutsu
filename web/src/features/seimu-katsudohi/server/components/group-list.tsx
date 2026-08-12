import "server-only";
import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { EXPENDITURE_CATEGORIES } from "../../shared/expenditure-categories";
import { formatYen } from "../../shared/format-yen";
import { sortReportsDefault } from "../../shared/sort-groups";
import type { SeimuKatsudohiReportWithItems } from "../../shared/types";

type GroupListProps = {
  fiscalYearSlug: string;
  reports: SeimuKatsudohiReportWithItems[];
};

/**
 * 会派・議員の並びは常に固定順（無所属→会派は人数順→50音順）。
 * 支出額での並べ替えは、金額の大小だけで比較・評価しているように見えるため置かない。
 */
export function GroupList({ fiscalYearSlug, reports }: GroupListProps) {
  if (reports.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-mirai-text-muted">
        公開されている政務活動費のデータはまだありません。
      </p>
    );
  }

  // カードをまたいだ棒の長さを比較できるように、全グループ・全費目を通した最大額を基準にする
  const maxAmount = Math.max(
    ...reports.flatMap((r) => r.items.map((i) => i.amount)),
    0
  );

  const sorted = sortReportsDefault(reports);

  return (
    <div>
      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-mirai-text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          この一覧は支出額の順位付けを目的としたものではありません。費目の使途は会派・議員により活動内容が異なるため、金額の大小だけで比較・評価できるものではありません。
        </span>
      </p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {sorted.map((report) => (
          <li key={report.id} id={encodeURIComponent(report.group_slug)}>
            <GroupCard
              fiscalYearSlug={fiscalYearSlug}
              report={report}
              maxAmount={maxAmount}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupCard({
  fiscalYearSlug,
  report,
  maxAmount,
}: {
  fiscalYearSlug: string;
  report: SeimuKatsudohiReportWithItems;
  maxAmount: number;
}) {
  const itemByCategory = new Map(
    report.items.map((i) => [i.category, i] as const)
  );

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-mirai-text-muted">
            {report.group_type === "caucus"
              ? `会派・${report.member_names.length}名（${report.member_names.join("、")}）`
              : "無会派"}
          </span>
          <h3 className="text-base font-bold leading-snug text-mirai-text">
            {report.group_name}
          </h3>
        </div>
        <Link
          href={`/seimu-katsudohi/${fiscalYearSlug}/${encodeURIComponent(report.group_slug)}`}
          className="shrink-0 text-xs font-bold text-primary-accent hover:underline"
        >
          内訳を見る
        </Link>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <div className="flex items-baseline gap-1">
          <dt className="text-mirai-text-muted">交付額</dt>
          <dd className="font-bold text-mirai-text tabular-nums">
            {formatYen(report.income_amount)}
          </dd>
        </div>
        <div className="flex items-baseline gap-1">
          <dt className="text-mirai-text-muted">支出</dt>
          <dd className="font-bold text-mirai-text tabular-nums">
            {formatYen(report.expenditure_total)}
          </dd>
        </div>
        <div className="flex items-baseline gap-1">
          <dt className="text-mirai-text-muted">残額</dt>
          <dd className="font-bold text-mirai-text tabular-nums">
            {formatYen(report.balance_amount)}
          </dd>
        </div>
      </dl>

      <ul className="mt-4 flex flex-col gap-2">
        {EXPENDITURE_CATEGORIES.map((category) => {
          const amount = itemByCategory.get(category.key)?.amount ?? 0;
          return (
            <li key={category.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-mirai-text-secondary">
                  {category.label}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-mirai-text-secondary">
                  {amount > 0 ? formatYen(amount) : "—"}
                </span>
              </div>
              {amount > 0 && <AmountBar value={amount} max={maxAmount} />}
            </li>
          );
        })}
      </ul>

      <Link
        href={report.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-xs text-mirai-text-muted hover:text-mirai-text"
      >
        <ExternalLink className="h-3 w-3 shrink-0" />
        収支報告書PDFを見る
      </Link>
    </div>
  );
}

/** 金額の棒。全グループ・全費目を通した最大額を基準にするため、カードをまたいだ比較ができる */
function AmountBar({ value, max }: { value: number; max: number }) {
  const width = max === 0 ? 0 : Math.max((value / max) * 100, 0.5);
  return (
    <div className="mt-1 h-1.5 w-full rounded-full bg-mirai-surface-grouped">
      <div
        className="h-1.5 rounded-full bg-primary"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
