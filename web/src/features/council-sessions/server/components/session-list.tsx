import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { CouncilSession, SessionSummary } from "../../shared/types";
import {
  formatSessionPeriod,
  groupSessionsByYear,
} from "../../shared/utils/group-sessions-by-year";

interface SessionListProps {
  sessions: CouncilSession[];
  /** session.id をキーにした集計。無ければ集計行を出さない */
  summaries?: Record<string, SessionSummary>;
}

export function SessionList({ sessions, summaries }: SessionListProps) {
  const grouped = groupSessionsByYear(sessions);

  if (grouped.length === 0) {
    return (
      <p className="text-mirai-text-secondary text-sm">
        表示できる議会はありません。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {grouped.map(({ year, sessions: yearSessions }) => (
        <section key={year}>
          <h2 className="text-lg font-bold text-mirai-text mb-3 pb-2 border-b border-mirai-border">
            {year}年
          </h2>
          <ul className="flex flex-col divide-y divide-mirai-border">
            {yearSessions.map((session) => {
              if (!session.slug) return null;
              const period = formatSessionPeriod(session);
              const summary = summaries?.[session.id];
              return (
                <li key={session.id}>
                  <Link
                    href={`/sessions/${session.slug}/bills`}
                    className="flex items-center justify-between py-4 px-2 hover:bg-mirai-surface-grouped rounded-lg transition-colors group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-mirai-text text-base">
                        {session.name}
                      </span>
                      <span className="text-xs text-mirai-text-secondary">
                        {period}
                      </span>
                      {summary && (
                        <span className="text-xs font-medium text-primary-accent">
                          提出議案{summary.billCount}件
                          {summary.splitVoteCount > 0 &&
                            `　賛否が分かれた議案${summary.splitVoteCount}件`}
                          {summary.generalQuestionsCount > 0 &&
                            `　一般質問${summary.generalQuestionsCount}件`}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-mirai-text-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
