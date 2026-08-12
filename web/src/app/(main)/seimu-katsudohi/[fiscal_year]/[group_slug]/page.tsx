import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { ReportDetailView } from "@/features/seimu-katsudohi/server/components/report-detail-view";
import { getReportDetail } from "@/features/seimu-katsudohi/server/loaders/get-report-detail";

interface SeimuKatsudohiDetailPageProps {
  params: Promise<{
    fiscal_year: string;
    group_slug: string;
  }>;
}

async function findReport(fiscalYear: string, rawGroupSlug: string) {
  const groupSlug = decodeURIComponent(rawGroupSlug);
  return getReportDetail(fiscalYear, groupSlug);
}

export async function generateMetadata({
  params,
}: SeimuKatsudohiDetailPageProps): Promise<Metadata> {
  const { fiscal_year, group_slug } = await params;
  const report = await findReport(fiscal_year, group_slug);

  if (!report) {
    return { title: "政務活動費のデータが見つかりません" };
  }

  return {
    title: `${report.group_name} の政務活動費（${report.fiscal_year_label}）`,
    description: `${report.fiscal_year_label}、${report.group_name}の政務活動費の内訳です。`,
    alternates: {
      canonical: `/seimu-katsudohi/${fiscal_year}/${encodeURIComponent(report.group_slug)}`,
    },
  };
}

export default async function SeimuKatsudohiDetailPage({
  params,
}: SeimuKatsudohiDetailPageProps) {
  const { fiscal_year, group_slug } = await params;
  const report = await findReport(fiscal_year, group_slug);

  if (!report) {
    notFound();
  }

  return (
    <Container className="py-10">
      <Link
        href={`/seimu-katsudohi/${fiscal_year}`}
        className="inline-flex items-center gap-1 text-sm text-mirai-text-secondary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {report.fiscal_year_label} 政務活動費の一覧に戻る
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-mirai-text">
          {report.group_name}
        </h1>
        <p className="mt-1 text-sm text-mirai-text-secondary">
          {report.fiscal_year_label} 政務活動費収支報告
        </p>
      </div>

      <ReportDetailView report={report} />
    </Container>
  );
}
