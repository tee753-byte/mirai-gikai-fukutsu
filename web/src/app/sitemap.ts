import type { MetadataRoute } from "next";
import { getBills } from "@/features/bills/server/loaders/get-bills";
import { getAllJimuJigyoIds } from "@/features/jimu-jigyo/server/loaders/load-jimu-jigyo-detail";
import { YEAR_METADATA } from "@/features/jimu-jigyo/server/loaders/load-jimu-jigyo-list";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.webUrl;

  const bills = await getBills();

  const billUrls = bills.map((bill) => ({
    url: `${baseUrl}/bills/${bill.id}`,
    lastModified: new Date(bill.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 事務事業評価（年度アーカイブ・年度別一覧・事業詳細）
  const jimuJigyoUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/jimu-jigyo`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    },
  ];
  for (const year of YEAR_METADATA) {
    jimuJigyoUrls.push({
      url: `${baseUrl}/jimu-jigyo/${year.slug}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    });
    const ids = await getAllJimuJigyoIds(year.slug);
    for (const id of ids) {
      jimuJigyoUrls.push({
        url: `${baseUrl}/jimu-jigyo/${year.slug}/${id}`,
        lastModified: new Date(),
        changeFrequency: "yearly" as const,
        priority: 0.5,
      });
    }
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...billUrls,
    ...jimuJigyoUrls,
  ];
}
