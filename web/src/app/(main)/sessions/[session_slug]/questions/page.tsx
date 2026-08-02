import { ArrowRight, Landmark, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { getCouncilSessionBySlug } from "@/features/council-sessions/server/loaders/get-council-session-by-slug";
import { SessionQuestionsSwitcher } from "@/features/general-questions/server/components/session-questions-switcher";
import { SessionTopicsView } from "@/features/general-questions/server/components/session-topics-view";
import { getGeneralQuestionsBySession } from "@/features/general-questions/server/loaders/get-general-questions-by-session";
import { getSessionsWithQuestions } from "@/features/general-questions/server/loaders/get-sessions-with-questions";

type Props = {
  params: Promise<{ session_slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { session_slug } = await params;
  const session = await getCouncilSessionBySlug(session_slug);

  if (!session) {
    return { title: "定例会が見つかりません" };
  }

  return {
    title: `${session.name}の一般質問 | ${siteConfig.siteName}`,
    description: `${session.name}で行われた一般質問の一覧です。議員が市長や市の担当部長に直接質問した内容をわかりやすく解説します。`,
  };
}

export default async function SessionQuestionsPage({ params }: Props) {
  const { session_slug } = await params;
  const session = await getCouncilSessionBySlug(session_slug);

  if (!session) {
    notFound();
  }

  const [questions, sessionsWithQuestions] = await Promise.all([
    getGeneralQuestionsBySession(session.id),
    getSessionsWithQuestions(),
  ]);

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mirai-text">
          {session.name}の一般質問
        </h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          議員が問い、市が答えた。あなたの暮らしに関わる取り組みをテーマ別にまとめました。
        </p>

        {/* 見方の入口。議員から入る道と、定例会から入る道の両方を出す */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/questions/members"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Users className="h-4 w-4 shrink-0" />
            議員から見る
            <ArrowRight className="h-3 w-3 shrink-0" />
          </Link>
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Landmark className="h-4 w-4 shrink-0" />
            議会ごとのまとめを見る
            <ArrowRight className="h-3 w-3 shrink-0" />
          </Link>
        </div>

        <SessionQuestionsSwitcher
          sessions={sessionsWithQuestions}
          currentSlug={session_slug}
        />
      </div>
      <SessionTopicsView questions={questions} />
    </Container>
  );
}
