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
  /** どこまで資料を反映できているかを会期ごとに出すか */
  showCoverage?: boolean;
}

/**
 * その会期がどこまで反映済みかの一文。
 *
 * 会議録は正式公開までおよそ3か月、議員別の賛否が載る市議会だよりはおよそ2か月かかる。
 * そのため直近の会期は必ず「議決結果まで」の状態になる。
 * 完成度の違いを隠して並べると読み手が誤解するので、カードに明示する。
 */
function coverageLabel(summary: SessionSummary): string {
  return summary.hasMemberVotes
    ? "会議録と議員別の賛否まで反映済み"
    : "議決結果まで掲載。討論と議員別の賛否は、会議録と市議会だよりの公開後に追加します";
}

export function SessionList({
  sessions,
  summaries,
  showCoverage = false,
}: SessionListProps) {
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
          <h2 className="text-lg font-bold text-mirai-text mb-3">{year}年</h2>
          {/* 会期ごとに白いカードで区切る。ページ背景が生成り色なのでカードが浮いて見える */}
          <ul className="flex flex-col gap-3">
            {yearSessions.map((session) => {
              if (!session.slug) return null;
              const period = formatSessionPeriod(session);
              const summary = summaries?.[session.id];
              return (
                <li key={session.id}>
                  <Link
                    href={`/sessions/${session.slug}/bills`}
                    className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary transition-colors group"
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
                      {showCoverage && summary && (
                        <span className="text-xs text-mirai-text-secondary">
                          {coverageLabel(summary)}
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
