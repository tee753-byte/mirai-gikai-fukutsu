import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BudgetChatClient } from "@/features/budget-overview/client/components/budget-chat-client";
import { ExpenditureComparison } from "@/features/budget-overview/client/components/expenditure-comparison";
import { BudgetOverviewList } from "@/features/budget-overview/server/components/budget-overview-list";
import { getBudgetOverviews } from "@/features/budget-overview/server/loaders/get-budget-overviews";
import { getSessionsWithBudget } from "@/features/budget-overview/server/loaders/get-sessions-with-budget";
import { getCouncilSessionBySlug } from "@/features/council-sessions/server/loaders/get-council-session-by-slug";

interface BudgetListPageProps {
  params: Promise<{
    session_slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BudgetListPageProps): Promise<Metadata> {
  const { session_slug } = await params;
  const session = await getCouncilSessionBySlug(session_slug);

  if (!session) {
    return { title: "会期が見つかりません" };
  }

  return {
    title: `${session.name} 予算の重点施策`,
    description: `${session.name}の予算の重点施策・方向性をわかりやすく解説します。`,
  };
}

function toFiscalYearLabel(sessionName: string): string {
  const match = sessionName.match(/令和(\d+)年/);
  return match ? `令和${match[1]}年度予算` : sessionName;
}

/** 年度切り替えのボタンに使う短い表記（「令和8年度」） */
function toShortYearLabel(sessionName: string): string {
  const match = sessionName.match(/令和(\d+)年/);
  return match ? `令和${match[1]}年度` : sessionName;
}

export default async function BudgetListPage({ params }: BudgetListPageProps) {
  const { session_slug } = await params;

  const [session, currentDifficulty] = await Promise.all([
    getCouncilSessionBySlug(session_slug),
    getDifficultyLevel(),
  ]);
  if (!session) {
    notFound();
  }

  const [overviews, budgetSessions] = await Promise.all([
    getBudgetOverviews(session.id),
    getSessionsWithBudget(),
  ]);

  return (
    <Container className="py-10 pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mirai-text">予算の重点施策</h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          {toFiscalYearLabel(session.name)}{" "}
          の予算の方向性と主要事業をまとめています。
        </p>
      </div>

      {/*
        年度の切り替え。掲載する年度が増えていくため、前年度への1本のリンクではなく
        並べて選べる形にする。1年度しか無いうちは出さない。
      */}
      {budgetSessions.length > 1 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold text-mirai-text">
            年度を切り替える
          </p>
          <div className="flex flex-wrap gap-2">
            {budgetSessions.map((s) => {
              if (!s.slug) return null;
              const isCurrent = s.slug === session_slug;
              return (
                <Link
                  key={s.id}
                  href={`/budget/${s.slug}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    isCurrent
                      ? "bg-primary text-white"
                      : "bg-mirai-surface-grouped text-mirai-text-secondary hover:bg-mirai-surface-muted"
                  }`}
                >
                  {toShortYearLabel(s.name)}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/*
        事業の一覧を先に置く。以前は歳出グラフの下に小さく並んでいて、
        一番読んでほしい37事業まで画面をかなりスクロールする必要があった。
      */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-mirai-text">
          何にいくら使うのか
        </h2>
        <BudgetOverviewList overviews={overviews} sessionSlug={session_slug} />
      </section>

      {/* 歳出の内訳と前年比（プロトタイプ。令和8年度の資料を転記した固定データ） */}
      {session_slug === "r8-3" && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold text-mirai-text">
            予算全体の内訳と前年比
          </h2>
          <ExpenditureComparison />
        </section>
      )}

      {siteConfig.features.aiChat && overviews.length > 0 && (
        <BudgetChatClient
          currentDifficulty={currentDifficulty}
          budget={{
            departmentName: `${session.name} 各局`,
            themes: overviews.map((o) => ({
              title: o.department_name,
              aiSummary: o.direction,
            })),
          }}
        />
      )}
    </Container>
  );
}
