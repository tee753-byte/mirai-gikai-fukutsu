import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { COMMITTEE_REPORT_SESSIONS } from "@/features/committee-reports/shared/data";
import type { CommitteeReportSession } from "@/features/committee-reports/shared/types";
import { STANDING_COMMITTEES } from "@/features/committee-reports/shared/types";

export const metadata: Metadata = {
  title: "委員会報告",
  alternates: { canonical: "/committee-reports" },
  description:
    "常任委員会（総務文教・市民福祉・建設環境）が議案を審査した内容を、議会ごとにまとめています。",
};

/** その会期で、どの委員会が何件審査したかを数える */
function committeeSummary(session: CommitteeReportSession) {
  return STANDING_COMMITTEES.map((name) => {
    const group = session.groups.find((g) => g.committeeName === name);
    return { name, count: group?.reviews.length ?? 0 };
  });
}

export default function CommitteeReportsPage() {
  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mirai-text">委員会報告</h1>
        <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
          本会議で採決する前に、議案は3つの常任委員会に分かれて詳しく審査されます。
          そこでどんな質疑があり、どんな結論になったかを議会ごとにまとめています。
        </p>
      </div>

      {COMMITTEE_REPORT_SESSIONS.length === 0 ? (
        <p className="text-sm text-mirai-text-muted">
          掲載できる委員会報告はまだありません。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {COMMITTEE_REPORT_SESSIONS.map((session) => {
            const summary = committeeSummary(session);
            const total = summary.reduce((sum, s) => sum + s.count, 0);

            return (
              <li key={session.slug}>
                <Link
                  href={`/committee-reports/${session.slug}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-primary group"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-mirai-text">{session.name}</p>
                    <p className="mt-0.5 text-xs text-mirai-text-muted">
                      {session.periodLabel} ・ 審査議案{total}件
                    </p>

                    {/* どの委員会が何件審査したか。付託が無かった委員会も出す */}
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      {summary.map((s) => (
                        <span
                          key={s.name}
                          className={`text-xs ${
                            s.count > 0
                              ? "text-mirai-text-secondary"
                              : "text-mirai-text-placeholder"
                          }`}
                        >
                          {s.name.replace("委員会", "")}
                          <span className="ml-1 font-bold">
                            {s.count > 0 ? `${s.count}件` : "なし"}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-mirai-text-muted transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs leading-relaxed text-mirai-text-muted">
        掲載しているのは、福津市議会が公開している常任委員会審査報告書の記載内容です。
        委員会の録画や議事録は市が公開していないため、報告書に書かれている範囲のみを載せています。
      </p>
    </Container>
  );
}
