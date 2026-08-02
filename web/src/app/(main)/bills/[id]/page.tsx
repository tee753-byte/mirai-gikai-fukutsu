import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDetailLayout } from "@/features/bills/server/components/bill-detail/bill-detail-layout";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { env } from "@/lib/env";

interface BillDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: BillDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);

  if (!bill) {
    return {
      title: "議案が見つかりません",
    };
  }

  // bill_contentのsummaryがあればそれを使用、なければデフォルト値を使用
  const description = bill.bill_content?.summary || "議案の詳細情報";
  const defaultOgpUrl = new URL("/ogp.jpg", env.webUrl).toString();

  /*
   * 給与条例の改正のように、毎年ほぼ同じ名前の議案が複数の定例会で出る。
   * 議案名だけをタイトルにすると検索結果もブラウザのタブも同じ文字列が並び、
   * どの定例会のものか分からなくなるため、議案番号と定例会名を添える。
   */
  const numberPrefix = bill.bill_number ? `${bill.bill_number} ` : "";
  const sessionSuffix = bill.council_session?.name
    ? ` | ${bill.council_session.name}`
    : "";
  const pageTitle = `${numberPrefix}${bill.name}${sessionSuffix}`;

  // シェア用OGP画像（share_thumbnail_url > thumbnail_url > デフォルト）
  // ページ表示用のthumbnail_urlとは別に、SNSシェア用の画像を優先
  const shareImageUrl =
    bill.share_thumbnail_url || bill.thumbnail_url || defaultOgpUrl;

  return {
    title: pageTitle,
    description: description,
    alternates: {
      canonical: `/bills/${bill.id}`,
    },
    openGraph: {
      title: pageTitle,
      description: description,
      type: "article",
      publishedTime: bill.published_at ?? undefined,
      modifiedTime: bill.updated_at,
      images: [
        {
          url: shareImageUrl,
          alt: `${bill.name} のOGPイメージ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: description,
      images: [shareImageUrl],
    },
  };
}

export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = await params;
  const [billWithContent, currentDifficulty] = await Promise.all([
    getBillById(id),
    getDifficultyLevel(),
  ]);

  if (!billWithContent) {
    notFound();
  }

  return (
    <BillDetailLayout
      bill={billWithContent}
      currentDifficulty={currentDifficulty}
    />
  );
}
