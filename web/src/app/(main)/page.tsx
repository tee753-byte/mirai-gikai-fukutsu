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
import { SessionPreviewContent } from "@/features/council-sessions/server/components/session-preview-content";
import {
  getSessionPreviewData,
  getTodayQuestionDay,
} from "@/features/council-sessions/server/data/session-preview-data";
import { getAllPastSessions } from "@/features/council-sessions/server/loaders/get-all-past-sessions";
import { getCurrentCouncilSession } from "@/features/council-sessions/server/loaders/get-current-council-session";
import { getLatestCouncilSession } from "@/features/council-sessions/server/loaders/get-latest-council-session";
import { getNextUpcomingCouncilSession } from "@/features/council-sessions/server/loaders/get-next-upcoming-council-session";
import { isSessionOpen } from "@/features/council-sessions/shared/utils/is-session-open";
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
    latestSession,
    currentDifficulty,
    pastSessions,
    budgetSessions,
    latestQuestionsSlug,
    seimuKatsudohiFiscalYears,
  ] = await Promise.all([
    getCurrentCouncilSession(getJapanTime()),
    getLatestCouncilSession(),
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

  // 一番新しい会期に、まだ議案の内容を掲載できていない場合だけ「予告」を出す
  // （議案の内容が掲載され始めたら session-preview-data.ts 側でこの会期のデータを消す）
  //
  // あえて currentSession（開催期間内かどうかの日付判定）ではなく latestSession
  // （単純に一番新しい会期）を使う。会期が閉会した瞬間に currentSession は null に
  // なるが、速報の実データが入るまでには数日かかるため、期間に関係なく「一番新しい
  // 会期にまだ実データが無いか」で出し分けないと、閉会直後にトップページから
  // 予告が消えて空白期間ができてしまう（2026-09-18に発覚）
  const sessionPreview =
    latestSession?.slug != null
      ? getSessionPreviewData(latestSession.slug)
      : null;

  // 「予告」中の会期が今日時点でまだ開催中かどうか（バッジ・文言の出し分け用）
  const isLatestSessionOpen =
    latestSession != null &&
    isSessionOpen(latestSession, toISODate(getJapanTime()));

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
        hasPreviewBanner={sessionPreview != null}
      />

      {/*
        一番新しい会期の予告（まだ議案の内容を掲載できていない会期のみ）
        「本日は」バーの直後に置く。会期日程・一般質問予定・議案等一覧をまるごと
        トップページに出す（予告ページ /sessions/[slug]/preview と同じ内容）。
        「一覧に飛ばないと今なにが話し合われているか分からない」との指摘を受けて、
        2026-09-13にバナー1行から現在の形に変更した。開催期間が終わっても
        （currentSessionがnullになっても）速報の実データが入るまでは出し続ける
        （2026-09-18、latestSessionベースに変更）。
      */}
      {sessionPreview && latestSession && (
        <Container className="pt-6">
          <SessionPreviewContent
            session={latestSession}
            preview={sessionPreview}
            headingLevel="h2"
            isOpen={isLatestSessionOpen}
          />
        </Container>
      )}

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
