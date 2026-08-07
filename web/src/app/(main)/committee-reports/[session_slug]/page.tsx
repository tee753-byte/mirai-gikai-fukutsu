import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { CommitteeReportCard } from "@/features/committee-reports/client/components/committee-report-card";
import {
  COMMITTEE_REPORT_SESSIONS,
  findCommitteeReportSession,
} from "@/features/committee-reports/shared/data";
import { STANDING_COMMITTEES } from "@/features/committee-reports/shared/types";

type PageProps = {
  params: Promise<{ session_slug: string }>;
};

/** 掲載している会期だけを静的に用意する */
export function generateStaticParams() {
  return COMMITTEE_REPORT_SESSIONS.map((s) => ({ session_slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { session_slug } = await params;
  const session = findCommitteeReportSession(session_slug);

  if (!session) return { title: "委員会報告が見つかりません" };

  return {
    title: `${session.name} 委員会報告`,
    description: `${session.name}で、常任委員会が議案を審査した内容をまとめています。`,
    alternates: { canonical: `/committee-reports/${session_slug}` },
  };
}

export default async function CommitteeReportSessionPage({
  params,
}: PageProps) {
  const { session_slug } = await params;
  const session = findCommitteeReportSession(session_slug);

  if (!session) {
    notFound();
  }

  return (
    <Container className="py-10">
      <Link
        href="/committee-reports"
        className="inline-flex items-center gap-1 text-sm text-mirai-text-muted hover:text-mirai-text"
      >
        <ArrowLeft className="h-4 w-4" />
        委員会報告の一覧に戻る
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-mirai-text">
          {session.name} 委員会報告
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
          本会議での採決の前に、委員会でどんなやり取りがあったかを掲載しています。
          質疑・意見・審査結果は、審査報告書の記載をそのまま載せています。
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {STANDING_COMMITTEES.map((committeeName) => {
          const group = session.groups.find(
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
                  この議会では、{committeeName}
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
