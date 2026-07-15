import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JimuJigyoListPage } from "@/features/jimu-jigyo/server/components/jimu-jigyo-list-page";
import {
  getYearMeta,
  isValidYear,
  YEAR_METADATA,
} from "@/features/jimu-jigyo/server/loaders/load-jimu-jigyo-list";

interface PageProps {
  params: Promise<{ year: string }>;
  searchParams: Promise<{
    bureau?: string;
    category?: string;
    q?: string;
    view?: string;
  }>;
}

export function generateStaticParams() {
  return YEAR_METADATA.map((y) => ({ year: y.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { year } = await params;
  if (!isValidYear(year)) return { title: "事務事業評価" };
  const meta = getYearMeta(year);
  return {
    title: `事務事業評価（${meta.label}）`,
    description: meta.description,
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { year } = await params;
  if (!isValidYear(year)) notFound();
  const sp = await searchParams;
  return (
    <JimuJigyoListPage
      year={year}
      basePath={`/jimu-jigyo/${year}`}
      searchParams={sp}
    />
  );
}
