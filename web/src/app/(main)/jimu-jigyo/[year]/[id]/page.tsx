import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { JimuJigyoDetailPage } from "@/features/jimu-jigyo/server/components/jimu-jigyo-detail-page";
import { loadJimuJigyoDetail } from "@/features/jimu-jigyo/server/loaders/load-jimu-jigyo-detail";
import { isValidYear } from "@/features/jimu-jigyo/server/loaders/load-jimu-jigyo-list";
import { normalizePdfText } from "@/features/jimu-jigyo/shared/utils/normalize-pdf-text";

// 難易度Cookieで概要/詳しく表示を切り替えるため動的レンダリング
// （議案詳細と同じ方式。generateStaticParams によるSSGは行わない）

interface PageProps {
  params: Promise<{ year: string; id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { year, id } = await params;
  if (!isValidYear(year)) return { title: "事務事業評価" };
  const record = await loadJimuJigyoDetail(year, decodeURIComponent(id));
  if (!record) return { title: "事業が見つかりません" };
  return {
    title: `${record.事業名}｜事務事業評価`,
    // PDFの折り返し改行が残ると description に不自然な改行が入る
    description:
      normalizePdfText(record.ねらい目的 || record.概要一覧?.事業の内容) ??
      undefined,
  };
}

export default async function Page({ params }: PageProps) {
  const { year, id } = await params;
  if (!isValidYear(year)) notFound();
  const [record, difficulty] = await Promise.all([
    loadJimuJigyoDetail(year, decodeURIComponent(id)),
    getDifficultyLevel(),
  ]);
  if (!record) notFound();
  return (
    <JimuJigyoDetailPage
      record={record}
      basePath={`/jimu-jigyo/${year}`}
      difficulty={difficulty}
    />
  );
}
