import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { getFiscalYearsWithReports } from "@/features/seimu-katsudohi/server/loaders/get-fiscal-years-with-reports";

export const metadata: Metadata = {
  title: "政務活動費の見える化",
  description:
    "福津市議会の会派・議員に交付されている政務活動費の年度一覧です。",
  alternates: { canonical: "/seimu-katsudohi" },
};

export default async function SeimuKatsudohiIndexPage() {
  const fiscalYears = await getFiscalYearsWithReports();

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-mirai-text">
          政務活動費の見える化
        </h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          福津市議会の会派・議員に交付されている政務活動費（月額2万円/人）の使いみちを、年度ごとにご覧いただけます。
        </p>
      </div>

      {fiscalYears.length === 0 ? (
        <p className="text-mirai-text-secondary text-sm py-8 text-center">
          掲載されている政務活動費のデータはまだありません。
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-mirai-border">
          {fiscalYears.map((fy) => (
            <li key={fy.slug}>
              <Link
                href={`/seimu-katsudohi/${fy.slug}`}
                className="flex items-center justify-between py-4 px-2 hover:bg-mirai-surface-grouped rounded-lg transition-colors group"
              >
                <span className="font-bold text-mirai-text text-base">
                  {fy.label}
                </span>
                <ChevronRight className="h-5 w-5 text-mirai-text-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
