import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { CommitteeReportCard } from "@/features/committee-reports/client/components/committee-report-card";
import { COMMITTEE_REPORTS_R8_6 } from "@/features/committee-reports/shared/data";

export const metadata: Metadata = {
  title: "委員会報告",
  description:
    "常任委員会（総務文教・市民福祉・建設環境）が議案を審査した内容をまとめています。",
};

/** 常任委員会は3つ。この定例会でデータが無い委員会は「報告なし」の状態で表示する */
const STANDING_COMMITTEES = [
  "総務文教委員会",
  "市民福祉委員会",
  "建設環境委員会",
] as const;

export default function CommitteeReportsPage() {
  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-mirai-text">委員会報告</h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          令和8年6月定例会で、常任委員会が議案を審査した内容をまとめています（プロトタイプ）。
          本会議での採決の前に、委員会でどんなやり取りがあったかを掲載しています。
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {STANDING_COMMITTEES.map((committeeName) => {
          const group = COMMITTEE_REPORTS_R8_6.find(
            (g) => g.committeeName === committeeName
          );

          return (
            <section key={committeeName}>
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-mirai-text">
                  {committeeName}
                </h2>
                {group && (
                  <span className="text-xs text-mirai-text-muted">
                    審査年月日: {group.reviewedAt}
                  </span>
                )}
              </div>

              {group ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.reviews.map((review) => (
                    <CommitteeReportCard
                      key={review.billNumber}
                      review={review}
                      sourceUrl={group.sourceUrl}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-mirai-text-muted">
                  この定例会では、{committeeName}
                  に付託された議案はありませんでした。
                </p>
              )}
            </section>
          );
        })}
      </div>
    </Container>
  );
}
