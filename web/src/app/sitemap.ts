import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import { getBills } from "@/features/bills/server/loaders/get-bills";
import { env } from "@/lib/env";

/**
 * サイトマップ（検索エンジンに「このサイトにはこんなページがある」と伝える一覧）。
 *
 * 【URLの決め方】以前は VERCEL_URL を使っていたが、これはデプロイのたびに変わる
 * 長いURL（mirai-gikai-fukutsu-xxxxx.vercel.app）なので、独自ドメインを設定しても
 * 検索エンジンに古いURLを伝え続けてしまう。そのため公開URLを次の順で決める。
 *
 *   1. NEXT_PUBLIC_WEB_URL … 公開URL。独自ドメインを取ったらこれを変える
 *   2. VERCEL_PROJECT_PRODUCTION_URL … 1が未設定のときの保険。Vercelが入れる
 *      本番の代表URL（独自ドメインがあればそれ、無ければプロジェクトの固定URL）
 *   3. localhost … ローカル開発用
 */
function resolveBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WEB_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) return `https://${vercelProductionUrl}`;

  return env.webUrl.replace(/\/$/, "");
}

/**
 * 議案以外の主要ページ。増えたらここに足す。
 * priority は「サイト内での相対的な重要度」で、1が最も高い。
 */
const STATIC_PAGES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/topics", priority: 0.9, changeFrequency: "weekly" },
  { path: "/sessions", priority: 0.8, changeFrequency: "weekly" },
  { path: "/budget", priority: 0.8, changeFrequency: "monthly" },
  { path: "/search", priority: 0.7, changeFrequency: "weekly" },
  { path: "/questions/members", priority: 0.7, changeFrequency: "weekly" },
  { path: "/committee-reports", priority: 0.7, changeFrequency: "weekly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();
  const now = new Date();

  const bills = await getBills();

  const billUrls = bills.map((bill) => ({
    url: `${baseUrl}/bills/${bill.id}`,
    lastModified: new Date(bill.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const staticUrls = STATIC_PAGES.filter(
    // 予算ページは設定でオフにできるため、出していないときは載せない
    (page) => page.path !== "/budget" || siteConfig.features.showBudget
  ).map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...staticUrls,
    ...billUrls,
  ];
}
