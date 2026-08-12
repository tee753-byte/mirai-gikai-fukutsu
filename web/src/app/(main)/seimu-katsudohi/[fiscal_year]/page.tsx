import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { GroupList } from "@/features/seimu-katsudohi/server/components/group-list";
import { getFiscalYearsWithReports } from "@/features/seimu-katsudohi/server/loaders/get-fiscal-years-with-reports";
import { getReportsByFiscalYear } from "@/features/seimu-katsudohi/server/loaders/get-reports-by-fiscal-year";

interface SeimuKatsudohiListPageProps {
  params: Promise<{
    fiscal_year: string;
  }>;
}

export async function generateMetadata({
  params,
}: SeimuKatsudohiListPageProps): Promise<Metadata> {
  const { fiscal_year } = await params;
  const fiscalYears = await getFiscalYearsWithReports();
  const current = fiscalYears.find((fy) => fy.slug === fiscal_year);

  if (!current) {
    return { title: "年度が見つかりません" };
  }

  return {
    title: `${current.label} 政務活動費`,
    description: `${current.label}の会派・議員別の政務活動費の使いみちをご覧いただけます。`,
    alternates: { canonical: `/seimu-katsudohi/${fiscal_year}` },
  };
}

export default async function SeimuKatsudohiListPage({
  params,
}: SeimuKatsudohiListPageProps) {
  const { fiscal_year } = await params;

  const fiscalYears = await getFiscalYearsWithReports();
  const current = fiscalYears.find((fy) => fy.slug === fiscal_year);
  if (!current) {
    notFound();
  }

  const reports = await getReportsByFiscalYear(fiscal_year);

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mirai-text">
          {current.label} 政務活動費
        </h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          会派・無会派議員ごとの、政務活動費の交付額・支出・残額です。
        </p>
      </div>

      <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <p className="text-xs leading-relaxed text-mirai-text-secondary">
          <strong className="font-bold text-mirai-text">政務活動費</strong>
          とは、市議会議員が行う調査研究など、議会活動に必要な経費の一部として、
          条例に基づき会派・議員に交付される公費です（月額2万円/人）。
          使いみちは条例で決められた費目の範囲に限られ、年度末に何にいくら使ったかを
          まとめた収支報告書の提出が義務づけられています。この一覧は、市が公開している
          その収支報告書をもとに作成しています。
        </p>
      </section>

      {fiscalYears.length > 1 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold text-mirai-text">
            年度を切り替える
          </p>
          <div className="flex flex-wrap gap-2">
            {fiscalYears.map((fy) => (
              <a
                key={fy.slug}
                href={`/seimu-katsudohi/${fy.slug}`}
                aria-current={fy.slug === fiscal_year ? "page" : undefined}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  fy.slug === fiscal_year
                    ? "bg-primary text-white"
                    : "bg-mirai-surface-grouped text-mirai-text-secondary hover:bg-mirai-surface-muted"
                }`}
              >
                {fy.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <GroupList fiscalYearSlug={fiscal_year} reports={reports} />
    </Container>
  );
}
