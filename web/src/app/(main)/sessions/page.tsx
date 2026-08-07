import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { getSessionBills } from "@/features/bills/server/loaders/get-session-bills";
import { summarizeSessionBills } from "@/features/bills/shared/utils/summarize-session-bills";
import { SessionList } from "@/features/council-sessions/server/components/session-list";
import {
  getAllSessionsWithBills,
  getSessionIdsWithMemberVotes,
} from "@/features/council-sessions/server/loaders/get-all-sessions-with-bills";
import type { SessionSummary } from "@/features/council-sessions/shared/types";
import { getGeneralQuestionsBySession } from "@/features/general-questions/server/loaders/get-general-questions-by-session";

export const metadata: Metadata = {
  title: "これまでの議会一覧",
  description: "これまでに開催された定例会・臨時会の一覧です。",
  alternates: { canonical: "/sessions" },
};

export default async function SessionsPage() {
  // 直近の会期は会議録も市議会だよりもまだ出ていないが、一覧からは落とさない。
  // どこまで反映済みかは会期ごとにカードへ書く（SessionList の showCoverage）。
  const [sessions, difficultyLevel, sessionIdsWithMemberVotes] =
    await Promise.all([
      getAllSessionsWithBills(),
      getDifficultyLevel(),
      getSessionIdsWithMemberVotes(),
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
        hasMemberVotes: sessionIdsWithMemberVotes.has(session.id),
      };

      return [session.id, summary] as const;
    })
  );
  const summaries = Object.fromEntries(summaryEntries);

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-mirai-text">
          これまでの議会一覧
        </h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          これまでに開催された定例会・臨時会とその議案をご覧いただけます。
          直近の議会は、議決結果まで掲載し、会議録と市議会だよりの公開後に討論と議員別の賛否を追加します。
        </p>
      </div>

      <SessionList sessions={sessions} summaries={summaries} showCoverage />
    </Container>
  );
}
