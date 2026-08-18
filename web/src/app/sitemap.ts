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
 *
 * ## lastModified（lastmod）の扱い ― ここを間違えると逆効果になる
 *
 * lastmod は「このページは前回来たときから変わったか」を検索エンジンに伝える印。
 * 正確なあいだは「変わっていないページは読み直さなくてよい」と判断してもらえるが、
 * 不正確だと値そのものが無視される（Googleの仕様）。
 *
 * そのため、ここでは次の方針を必ず守る。
 *
 * - **`new Date()`（実行時の現在時刻）は絶対に使わない。** デプロイするだけで全ページが
 *   「今日更新された」と主張してしまい、中身が変わっていないページの読み直しに
 *   クロールが使われる。まだ読まれていないページに回る分をこちらで削ってしまう。
 * - データベースに更新日時があるページは、その値をそのまま使う。
 * - 更新日時を持たないページ（内容がコードに書かれている一覧ページなど）は
 *   **lastmod を付けない。** 空欄は許容されるが、間違った日付は害になる。
 */

/**
 * 議案以外の主要ページ。増えたらここに足す。
 * priority は「サイト内での相対的な重要度」で、1が最も高い。
 *
 * lastmod は原則付けない（内容がコードで決まるため更新日時を持たない）。
 * ただし「配下のデータが増えたら中身も変わる」一覧ページだけは、
 * `resolveStaticPageLastModified` で配下データの最新更新日時を割り当てる。
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

/**
 * 渡された日時のうち最も新しいものを返す。1つも無ければ undefined。
 *
 * 一覧ページの lastmod に使う。「配下のどれかが更新された日 = 一覧の内容が
 * 変わった日」とみなせるため。空・不正な値は無視する。
 */
function newestDate(values: (string | null | undefined)[]): Date | undefined {
  const times = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time));

  return times.length > 0 ? new Date(Math.max(...times)) : undefined;
}

/**
 * lastModified を「値があるときだけ」入れるための小さな入れ物。
 *
 * `lastModified: undefined` をそのまま渡すとXMLに空の要素が出るのを避けたいので、
 * スプレッド構文（`...`）でキーごと消せる形にしておく。
 */
function lastModifiedField(date: Date | undefined) {
  return date ? { lastModified: date } : {};
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();

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
      ...lastModifiedField(newestDate([entry.updatedAt])),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  // 議員ごとのページ。日本語の氏名がURLに入るためエンコードする。
  // lastmod はその議員の掲載データのうち最も新しい更新日時。
  // 質問実績が0件の議員（名簿から補っている）は日付が無いため lastmod なし。
  const memberUrls = questionerGroups.map((group) => ({
    url: `${baseUrl}/questions/members/${encodeURIComponent(group.slug)}`,
    ...lastModifiedField(
      newestDate(group.entries.map((entry) => entry.updatedAt))
    ),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // 会期ごとの議案一覧・一般質問一覧。開催中の会期も含める。
  // slug が同じ重複を除きつつ、lastmod に使う updated_at を持ち回る
  const sessions = [activeSession, ...pastSessions]
    .filter((session) => session !== null)
    .filter(
      (session, index, all) =>
        all.findIndex((other) => other.slug === session.slug) === index
    );
  const sessionUrls = sessions.flatMap((session) => {
    const lastModified = lastModifiedField(newestDate([session.updated_at]));
    return [
      {
        url: `${baseUrl}/sessions/${session.slug}/bills`,
        ...lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/sessions/${session.slug}/questions`,
        ...lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
    ];
  });

  // 会期ごとの予算ページ。個別の施策ページは会期ページから辿れる
  const budgetUrls = budgetSessions.map((session) => ({
    url: `${baseUrl}/budget/${session.slug}`,
    ...lastModifiedField(newestDate([session.updated_at])),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // 年度ごとの政務活動費ページ。年度一覧は更新日時を持たないため lastmod なし
  const seimuKatsudohiUrls = seimuKatsudohiFiscalYears.map((fy) => ({
    url: `${baseUrl}/seimu-katsudohi/${fy.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // 会期ごとの委員会報告。掲載している会期だけを載せる。
  // 内容はコード（shared/data.ts）に書かれており更新日時を持たないため lastmod なし
  const committeeUrls = COMMITTEE_REPORT_SESSIONS.map((session) => ({
    url: `${baseUrl}/committee-reports/${session.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // データベース由来の更新日時。一覧ページとトップページの lastmod に使う
  const newestBillDate = newestDate(bills.map((bill) => bill.updated_at));
  const newestQuestionDate = newestDate(
    questionerGroups.flatMap((group) =>
      group.entries.map((entry) => entry.updatedAt)
    )
  );
  const newestSessionDate = newestDate(
    sessions.map((session) => session.updated_at)
  );
  const newestBudgetDate = newestDate(
    budgetSessions.map((session) => session.updated_at)
  );

  /**
   * 一覧ページの lastmod。配下データの更新日時を持てるページだけ返す。
   * ここに無いページ（/topics・/faq・/terms 等）は lastmod を付けない。
   */
  function resolveStaticPageLastModified(path: string): Date | undefined {
    if (path === "/sessions") return newestSessionDate;
    if (path === "/questions/members") return newestQuestionDate;
    if (path === "/budget") return newestBudgetDate;
    return undefined;
  }

  const staticUrls = STATIC_PAGES.filter((page) => {
    // 予算・政務活動費ページは設定でオフにできるため、出していないときは載せない
    if (page.path === "/budget") return siteConfig.features.showBudget;
    if (page.path === "/seimu-katsudohi") {
      return siteConfig.features.showSeimuKatsudohi;
    }
    return true;
  }).map((page) => ({
    url: `${baseUrl}${page.path}`,
    ...lastModifiedField(resolveStaticPageLastModified(page.path)),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  return [
    {
      url: baseUrl,
      // トップページは新着を集約して表示するため、
      // 掲載データ全体で最も新しい更新日時をそのまま使う
      ...lastModifiedField(
        newestDate(
          [
            newestBillDate,
            newestQuestionDate,
            newestSessionDate,
            newestBudgetDate,
          ].map((date) => date?.toISOString())
        )
      ),
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
