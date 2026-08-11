import { ArrowRight, Info, Landmark, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
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

  const questions = await getGeneralQuestionsBySession(session.id);
  const hasSokatsu = questions.some(
    (q) => q.question_type === "sokatsu_shitsugi"
  );
  const heading = hasSokatsu
    ? `${session.name}の一般質問・総括質疑`
    : `${session.name}の一般質問`;

  return {
    title: heading,
    description: `${session.name}で行われた一般質問${hasSokatsu ? "・総括質疑" : ""}の一覧です。議員が市長や市の担当部長に直接質問した内容をわかりやすく解説します。`,
    alternates: { canonical: `/sessions/${session_slug}/questions` },
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

  const hasSokatsu = questions.some(
    (q) => q.question_type === "sokatsu_shitsugi"
  );

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mirai-text">
          {session.name}の一般質問{hasSokatsu && "・総括質疑"}
        </h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          議員が問い、市が答えた。あなたの暮らしに関わる取り組みをテーマ別にまとめました。
        </p>

        {hasSokatsu && (
          <p className="mt-3 inline-flex items-start gap-1.5 rounded-md bg-mirai-surface-muted px-3 py-2 text-xs leading-relaxed text-mirai-text-secondary">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              総括質疑とは、市長の施政方針に対して行う質疑です。3月定例会では、議員によって一般質問を行う場合と、総括質疑を行う場合があります。
            </span>
          </p>
        )}

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
