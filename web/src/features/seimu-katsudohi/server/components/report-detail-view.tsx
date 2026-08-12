import "server-only";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { EXPENDITURE_CATEGORIES } from "../../shared/expenditure-categories";
import { formatYen } from "../../shared/format-yen";
import type { SeimuKatsudohiReportWithItems } from "../../shared/types";

type ReportDetailViewProps = {
  report: SeimuKatsudohiReportWithItems;
};

export function ReportDetailView({ report }: ReportDetailViewProps) {
  const itemByCategory = new Map(
    report.items.map((i) => [i.category, i] as const)
  );

  return (
    <div>
      <div className="rounded-lg border border-border bg-card p-5">
        <span className="text-xs font-bold text-mirai-text-muted">
          {report.group_type === "caucus"
            ? `会派・${report.member_names.length}名（${report.member_names.join("、")}）`
            : "無会派"}
        </span>

        <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3">
          <div>
            <dt className="text-xs text-mirai-text-muted">交付額</dt>
            <dd className="mt-0.5 text-lg font-bold text-mirai-text tabular-nums">
              {formatYen(report.income_amount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-mirai-text-muted">支出合計</dt>
            <dd className="mt-0.5 text-lg font-bold text-mirai-text tabular-nums">
              {formatYen(report.expenditure_total)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-mirai-text-muted">残額</dt>
            <dd className="mt-0.5 text-lg font-bold text-mirai-text tabular-nums">
              {formatYen(report.balance_amount)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-mirai-text-muted">
              <th className="py-2 pr-3 font-bold">項目</th>
              <th className="py-2 pr-3 text-right font-bold">金額</th>
              <th className="py-2 font-bold">備考</th>
            </tr>
          </thead>
          <tbody>
            {EXPENDITURE_CATEGORIES.map((category) => {
              const item = itemByCategory.get(category.key);
              const amount = item?.amount ?? 0;
              return (
                <tr key={category.key} className="border-b border-border">
                  <td className="py-2 pr-3 text-mirai-text">
                    {category.label}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-mirai-text">
                    {amount > 0 ? formatYen(amount) : "—"}
                  </td>
                  <td className="py-2 text-mirai-text-secondary">
                    {item?.note ?? ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-mirai-text-muted">
        金額は収支報告書PDFに書かれている数字をそのまま転記しています。備考欄はPDFの手書きメモをそのまま転記したものです。
      </p>

      <Link
        href={report.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary-accent hover:underline"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        出典：{report.fiscal_year_label} 政務活動費収支報告書（
        {report.group_name}）
      </Link>
    </div>
  );
}
