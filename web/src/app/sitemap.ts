import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import { getBills } from "@/features/bills/server/loaders/get-bills";
import { getSessionsWithBudget } from "@/features/budget-overview/server/loaders/get-sessions-with-budget";
import { COMMITTEE_REPORT_SESSIONS } from "@/features/committee-reports/shared/data";
import { getActiveCouncilSession } from "@/features/council-sessions/server/loaders/get-active-council-session";
import { getAllPastSessions } from "@/features/council-sessions/server/loaders/get-all-past-sessions";
import { getQuestionerGroups } from "@/features/general-questions/server/loaders/get-questioner-groups";
import { getFiscalYearsWithReports } from "@/features/seimu-katsudohi/server/loaders/get-fiscal-years-with-reports";
import { resolveBaseUrl } from "@/lib/site-url";

/**
 * サイトマップ（検索エンジンに「このサイトにはこんなページがある」と伝える一覧）。
 *
 * 公開URLの決め方は `@/lib/site-url` にまとめてある（canonical・robots.txt と
 * 同じ値を使わないと、検索エンジンに別サイト扱いされてしまうため）。
 */

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
  { path: "/seimu-katsudohi", priority: 0.6, changeFrequency: "monthly" },
  { path: "/search", priority: 0.7, changeFrequency: "weekly" },
  { path: "/questions/members", priority: 0.7, changeFrequency: "weekly" },
  { path: "/committee-reports", priority: 0.7, changeFrequency: "weekly" },
  // 運営者情報・利用条件。検索から直接たどり着けるようにしておく
  { path: "/faq", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();
  const now = new Date();

  const [
    bills,
    questionerGroups,
    pastSessions,
    activeSession,
    budgetSessions,
    seimuKatsudohiFiscalYears,
  ] = await Promise.all([
    getBills(),
    getQuestionerGroups(),
    getAllPastSessions(),
    getActiveCouncilSession(),
    siteConfig.features.showBudget
      ? getSessionsWithBudget()
      : Promise.resolve([]),
    siteConfig.features.showSeimuKatsudohi
      ? getFiscalYearsWithReports()
      : Promise.resolve([]),
  ]);

  const billUrls = bills.map((bill) => ({
    url: `${baseUrl}/bills/${bill.id}`,
    lastModified: new Date(bill.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 一般質問の本文ページ。件数が最も多く、内容も具体的なので必ず載せる
  const questionUrls = questionerGroups.flatMap((group) =>
    group.entries.map((entry) => ({
      url: `${baseUrl}/questions/${entry.questionId}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  // 議員ごとのページ。日本語の氏名がURLに入るためエンコードする
  const memberUrls = questionerGroups.map((group) => ({
    url: `${baseUrl}/questions/members/${encodeURIComponent(group.slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // 会期ごとの議案一覧・一般質問一覧。開催中の会期も含める
  const sessionSlugs = [
    ...new Set(
      [activeSession, ...pastSessions]
        .filter((s) => s !== null)
        .map((s) => s.slug)
    ),
  ];
  const sessionUrls = sessionSlugs.flatMap((slug) => [
    {
      url: `${baseUrl}/sessions/${slug}/bills`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sessions/${slug}/questions`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ]);

  // 会期ごとの予算ページ。個別の施策ページは会期ページから辿れる
  const budgetUrls = budgetSessions.map((session) => ({
    url: `${baseUrl}/budget/${session.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // 年度ごとの政務活動費ページ
  const seimuKatsudohiUrls = seimuKatsudohiFiscalYears.map((fy) => ({
    url: `${baseUrl}/seimu-katsudohi/${fy.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // 会期ごとの委員会報告。掲載している会期だけを載せる
  const committeeUrls = COMMITTEE_REPORT_SESSIONS.map((session) => ({
    url: `${baseUrl}/committee-reports/${session.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const staticUrls = STATIC_PAGES.filter((page) => {
    // 予算・政務活動費ページは設定でオフにできるため、出していないときは載せない
    if (page.path === "/budget") return siteConfig.features.showBudget;
    if (page.path === "/seimu-katsudohi") {
      return siteConfig.features.showSeimuKatsudohi;
    }
    return true;
  }).map((page) => ({
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
    ...sessionUrls,
    ...budgetUrls,
    ...seimuKatsudohiUrls,
    ...committeeUrls,
    ...billUrls,
    ...memberUrls,
    ...questionUrls,
  ];
}
