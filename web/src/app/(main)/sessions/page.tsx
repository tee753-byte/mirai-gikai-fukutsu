import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { getSessionBills } from "@/features/bills/server/loaders/get-session-bills";
import { summarizeSessionBills } from "@/features/bills/shared/utils/summarize-session-bills";
import { SessionList } from "@/features/council-sessions/server/components/session-list";
import { getAllPastSessions } from "@/features/council-sessions/server/loaders/get-all-past-sessions";
import type { SessionSummary } from "@/features/council-sessions/shared/types";
import { getGeneralQuestionsBySession } from "@/features/general-questions/server/loaders/get-general-questions-by-session";

export const metadata: Metadata = {
  title: "過去の議会一覧",
  description: "過去に開催された定例会の一覧です。",
};

export default async function SessionsPage() {
  const [sessions, difficultyLevel] = await Promise.all([
    getAllPastSessions(),
    getDifficultyLevel(),
  ]);

  const summaryEntries = await Promise.all(
    sessions.map(async (session) => {
      const [bills, generalQuestions] = await Promise.all([
        getSessionBills(session.id, difficultyLevel),
        getGeneralQuestionsBySession(session.id),
      ]);
      const billSummary = summarizeSessionBills(bills);

      const summary: SessionSummary = {
        billCount: billSummary.total,
        splitVoteCount: billSummary.splitVoteBills.length,
        generalQuestionsCount: generalQuestions.length,
      };

      return [session.id, summary] as const;
    })
  );
  const summaries = Object.fromEntries(summaryEntries);

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-mirai-text">過去の議会一覧</h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          過去に開催された定例会とその議案をご覧いただけます。
        </p>
      </div>

      <SessionList sessions={sessions} summaries={summaries} />
    </Container>
  );
}
