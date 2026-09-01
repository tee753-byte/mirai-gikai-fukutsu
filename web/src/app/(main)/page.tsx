import { Container } from "@/components/layouts/container";
import { JsonLd } from "@/components/seo/json-ld";
import { About } from "@/components/top/about";
import { BudgetOverviewBanner } from "@/components/top/budget-overview-banner";
import { CommitteeReportsBanner } from "@/components/top/committee-reports-banner";
import { GeneralQuestionsBanner } from "@/components/top/general-questions-banner";
import { Hero } from "@/components/top/hero";
import { PastSessionsSection } from "@/components/top/past-sessions-section";
import { SeimuKatsudohiBanner } from "@/components/top/seimu-katsudohi-banner";
import { TeamMirai } from "@/components/top/team-mirai";
import { TopicsListCard } from "@/components/top/topics-list-card";
import { siteConfig } from "@/config/site.config";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDisclaimer } from "@/features/bills/client/components/bill-detail/bill-disclaimer";
import { BillsByTagSection } from "@/features/bills/server/components/bills-by-tag-section";
import { FeaturedBillSection } from "@/features/bills/server/components/featured-bill-section";
import { loadHomeData } from "@/features/bills/server/loaders/load-home-data";
import type { BillWithContent } from "@/features/bills/shared/types";
import { getSessionsWithBudget } from "@/features/budget-overview/server/loaders/get-sessions-with-budget";
import { HomeChatClient } from "@/features/chat/client/components/home-chat-client";
import { CurrentCouncilSession } from "@/features/council-sessions/client/components/current-council-session";
import { getTodayQuestionDay } from "@/features/council-sessions/server/data/session-preview-data";
import { getAllPastSessions } from "@/features/council-sessions/server/loaders/get-all-past-sessions";
import { getCurrentCouncilSession } from "@/features/council-sessions/server/loaders/get-current-council-session";
import { getNextUpcomingCouncilSession } from "@/features/council-sessions/server/loaders/get-next-upcoming-council-session";
import { getLatestSessionWithQuestions } from "@/features/general-questions/server/loaders/get-latest-session-with-questions";
import { getFiscalYearsWithReports } from "@/features/seimu-katsudohi/server/loaders/get-fiscal-years-with-reports";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/lib/structured-data";
import { getJapanTime, toISODate } from "@/lib/utils/date";

export default async function Home() {
  const { billsByTag, featuredBills } = await loadHomeData();

  // ゆくゆくタグ機能がマージされたらBFFに統合する
  const [
    currentSession,
    currentDifficulty,
    pastSessions,
    budgetSessions,
    latestQuestionsSlug,
    seimuKatsudohiFiscalYears,
  ] = await Promise.all([
    getCurrentCouncilSession(getJapanTime()),
    getDifficultyLevel(),
    getAllPastSessions(),
    getSessionsWithBudget(),
    getLatestSessionWithQuestions(),
    getFiscalYearsWithReports(),
  ]);

  // 閉会中のときだけ、次に開会予定の定例会を調べる（「本日は」バーの案内用）
  const upcomingSession =
    currentSession == null
      ? await getNextUpcomingCouncilSession(getJapanTime())
      : null;

  // 開会中で、かつ今日が一般質問の登壇日なら、その日の登壇者を「本日は」バーに出す
  const todayQuestionDay =
    currentSession?.slug != null
      ? getTodayQuestionDay(currentSession.slug, toISODate(getJapanTime()))
      : null;

  const toBillChatContext = (bill: BillWithContent) => {
    return {
      name: `${bill.bill_content?.title}（${bill.name}）`,
      summary: bill.bill_content?.summary,
      tags: bill.tags?.map((tag) => tag.label) || [],
      isFeatured: featuredBills.some((b) => b.id === bill.id),
    };
  };

  return (
    <>
      {/* 検索エンジン向けのサイト情報。画面には何も出ない */}
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd data={buildOrganizationSchema()} />

      <Hero />

      {/* 本日の定例会セクション */}
      <CurrentCouncilSession
        session={currentSession}
        upcomingSession={upcomingSession}
        todayQuestionDay={todayQuestionDay}
      />

      {/* トピックス（暮らしに関わりの大きいテーマ）
          市民に一番読んでほしい内容なので、各機能への入口より前に置く。
          詳しい版に戻す場合は TopicsHighlight に差し替える */}
      <Container className="pt-6">
        <TopicsListCard />
      </Container>

      {/* 一般質問バナー */}
      {latestQuestionsSlug && (
        <Container className="pt-6">
          <GeneralQuestionsBanner sessionSlug={latestQuestionsSlug} />
        </Container>
      )}

      {/* 予算概要バナー（予算データがある直近の会期にリンクする。開会中の会期とは限らない） */}
      {siteConfig.features.showBudget && budgetSessions[0]?.slug && (
        <Container className="pt-3">
          <BudgetOverviewBanner sessionSlug={budgetSessions[0].slug} />
        </Container>
      )}

      {/* 委員会報告バナー（プロトタイプ） */}
      <Container className="pt-3">
        <CommitteeReportsBanner />
      </Container>

      {/*
        政務活動費バナー（プロトタイプ。データがある直近の年度にリンクする）
        一般質問・予算・委員会報告（＝議会そのものを理解する主要機能）より後ろに置く。
        政務活動費は情報として価値は高いが、本筋を追ううえでは優先度が一段下がるため。
      */}
      {siteConfig.features.showSeimuKatsudohi &&
        seimuKatsudohiFiscalYears[0]?.slug && (
          <Container className="pt-3">
            <SeimuKatsudohiBanner
              fiscalYearSlug={seimuKatsudohiFiscalYears[0].slug}
            />
          </Container>
        )}

      {/* 議案一覧セクション */}
      <Container className="">
        <div className="py-10">
          <div className="flex flex-col gap-16">
            {/* 注目の議案セクション */}
            <FeaturedBillSection bills={featuredBills} />

            {/* タグ別議案一覧セクション */}
            <BillsByTagSection billsByTag={billsByTag} />
          </div>
        </div>
      </Container>

      {/* 過去の定例会セクション（Archive） */}
      <div className="bg-mirai-surface-muted py-10">
        <Container>
          <PastSessionsSection
            sessions={pastSessions}
            budgetSessions={
              siteConfig.features.showBudget ? budgetSessions : []
            }
          />
        </Container>
      </div>

      <Container>
        {/* みらい議会とは セクション */}
        <About />

        {/* チームみらいについて セクション */}
        <TeamMirai />

        {/* 免責事項 */}
        <BillDisclaimer />
      </Container>

      {/* チャット機能 */}
      {siteConfig.features.aiChat && (
        <HomeChatClient
          currentDifficulty={currentDifficulty}
          bills={billsByTag
            .flatMap((x) => x.bills)
            .concat(featuredBills)
            .map(toBillChatContext)}
        />
      )}
    </>
  );
}
