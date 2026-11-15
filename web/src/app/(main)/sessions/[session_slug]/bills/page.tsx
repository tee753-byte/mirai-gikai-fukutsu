import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { SessionBillsPage } from "@/features/bills/server/components/session-bills-page";
import { getSessionBills } from "@/features/bills/server/loaders/get-session-bills";
import { getSessionPreviewData } from "@/features/council-sessions/server/data/session-preview-data";
import { getCouncilSessionBySlug } from "@/features/council-sessions/server/loaders/get-council-session-by-slug";
import { getGeneralQuestionsBySession } from "@/features/general-questions/server/loaders/get-general-questions-by-session";

interface SessionBillsRouteProps {
  params: Promise<{
    session_slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: SessionBillsRouteProps): Promise<Metadata> {
  const { session_slug } = await params;
  const session = await getCouncilSessionBySlug(session_slug);

  if (!session) {
    return { title: "会期が見つかりません" };
  }

  return {
    title: `${session.name} 議案一覧`,
    description: `${session.name}に上程された議案の一覧です。`,
    alternates: { canonical: `/sessions/${session_slug}/bills` },
  };
}

export default async function SessionBillsRoute({
  params,
}: SessionBillsRouteProps) {
  const { session_slug } = await params;

  const [session, difficultyLevel] = await Promise.all([
    getCouncilSessionBySlug(session_slug),
    getDifficultyLevel(),
  ]);

  if (!session) {
    notFound();
  }

  const [bills, generalQuestions] = await Promise.all([
    getSessionBills(session.id, difficultyLevel),
    getGeneralQuestionsBySession(session.id),
  ]);

  // 実データがまだ無く、予告ページがある会期は予告へ案内する。予告では件名や
  // 質問予定を公開済みなのに、ここが「0件」「準備中」と出ると矛盾して見えるため
  // （2026-11-15、外部レビューで指摘）。実データが入れば転送は自然に止まる。
  // 一時的な転送なので 307（redirect）を使う。
  if (bills.length === 0 && getSessionPreviewData(session_slug)) {
    redirect(`/sessions/${session_slug}/preview`);
  }

  const sokatsuQuestionsCount = generalQuestions.filter(
    (q) => q.question_type === "sokatsu_shitsugi"
  ).length;

  return (
    <Container className="py-10">
      <SessionBillsPage
        session={session}
        bills={bills}
        generalQuestionsCount={generalQuestions.length - sokatsuQuestionsCount}
        sokatsuQuestionsCount={sokatsuQuestionsCount}
      />
    </Container>
  );
}
