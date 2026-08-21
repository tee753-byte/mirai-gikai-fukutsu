import { ChevronDown } from "lucide-react";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Badge } from "@/components/ui/badge";
import {
  getSessionPreviewData,
  type PreviewBillType,
} from "@/features/council-sessions/server/data/session-preview-data";
import { getCouncilSessionBySlug } from "@/features/council-sessions/server/loaders/get-council-session-by-slug";

type Props = {
  params: Promise<{ session_slug: string }>;
};

const BILL_TYPE_BADGE_CLASS: Record<PreviewBillType, string> = {
  議案: "bg-bill-type-bill-bg border-bill-type-bill-border text-bill-type-bill-text",
  認定: "bg-bill-type-bill-bg border-bill-type-bill-border text-bill-type-bill-text",
  請願: "bg-bill-type-petition-bg border-bill-type-petition-border text-bill-type-petition-text",
  報告: "bg-bill-type-other-bg border-bill-type-other-border text-bill-type-other-text",
  同意: "bg-bill-type-other-bg border-bill-type-other-border text-bill-type-other-text",
};

export async function generateMetadata({ params }: Props) {
  const { session_slug } = await params;
  const session = await getCouncilSessionBySlug(session_slug);
  const preview = getSessionPreviewData(session_slug);

  if (!session || !preview) {
    return { title: "定例会が見つかりません" };
  }

  return {
    title: `${session.name}の予告`,
    description: preview.lead,
    alternates: { canonical: `/sessions/${session_slug}/preview` },
  };
}

export default async function SessionPreviewPage({ params }: Props) {
  const { session_slug } = await params;
  const [session, preview] = await Promise.all([
    getCouncilSessionBySlug(session_slug),
    Promise.resolve(getSessionPreviewData(session_slug)),
  ]);

  if (!session || !preview) {
    notFound();
  }

  const memberCount = preview.questionDays.reduce(
    (sum, day) => sum + day.members.length,
    0
  );
  const billTypeCounts = preview.bills.reduce<Record<string, number>>(
    (acc, bill) => {
      const key = bill.type;
      const count = bill.type === "同意" ? 11 : 1;
      acc[key] = (acc[key] ?? 0) + count;
      return acc;
    },
    {}
  );
  const billCountLabel = (
    ["報告", "同意", "議案", "認定", "請願"] as PreviewBillType[]
  )
    .filter((type) => billTypeCounts[type])
    .map((type) => `${type}${billTypeCounts[type]}`)
    .join("・");
  const totalBillCount = Object.values(billTypeCounts).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <Container className="py-8">
      <Badge variant="billReviewing">
        予告 — 会期日程・一般質問通告書・議案等にもとづく予定
      </Badge>

      <h1 className="mt-2 text-2xl font-bold text-mirai-text leading-snug">
        {preview.headline}
      </h1>
      <p className="mt-1 text-sm text-mirai-text-muted">
        {session.name}・会期 {formatRange(session.start_date, session.end_date)}
      </p>

      <p className="mt-4 text-sm leading-relaxed text-mirai-text-secondary">
        {preview.lead}
      </p>

      <nav className="mt-5 flex flex-wrap gap-2">
        <a
          href="#schedule"
          className="rounded-full bg-mirai-surface-grouped px-3 py-1.5 text-xs font-bold text-primary-accent"
        >
          会期日程
        </a>
        <a
          href="#questions"
          className="rounded-full bg-mirai-surface-grouped px-3 py-1.5 text-xs font-bold text-primary-accent"
        >
          一般質問予定（{memberCount}名）
        </a>
        <a
          href="#bills"
          className="rounded-full bg-mirai-surface-grouped px-3 py-1.5 text-xs font-bold text-primary-accent"
        >
          議案等一覧（{totalBillCount}件）
        </a>
      </nav>

      {/* 会期日程 */}
      <section id="schedule" className="mt-8 scroll-mt-20">
        <h2 className="text-base font-bold text-mirai-text">会期日程</h2>
        <div className="mt-3 rounded-lg border border-border bg-card p-5">
          <ol className="ml-1 space-y-4 border-l-2 border-border pl-5">
            {preview.schedule.map((item) => (
              <li key={item.label} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-xs font-bold text-primary-accent">
                  {item.date}
                </p>
                <p className="text-sm font-bold text-mirai-text">
                  {item.label}
                </p>
                <p className="text-xs text-mirai-text-secondary">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 一般質問予定 */}
      <section id="questions" className="mt-8 scroll-mt-20">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold text-mirai-text">
            一般質問予定 一覧
          </h2>
          <span className="text-xs text-mirai-text-muted">
            {memberCount}名・登壇順
          </span>
        </div>
        <p className="mt-1 text-xs text-mirai-text-muted">
          タップすると質問要旨が開きます
        </p>

        <div className="mt-3 space-y-6">
          {preview.questionDays.map((day) => (
            <div key={day.tag}>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="rounded bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                  {day.tag}
                </span>
                <span className="text-xs text-mirai-text-muted">
                  {day.date}
                </span>
              </div>

              <div className="space-y-2">
                {day.members.map((member) => (
                  <details
                    key={member.name}
                    className="group rounded-lg border border-border bg-card overflow-hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-baseline gap-2.5">
                        <span className="shrink-0 text-sm font-bold text-mirai-text">
                          {member.name}
                        </span>
                        <span className="truncate text-xs text-mirai-text-secondary">
                          {member.questions.map((q) => q.title).join("／")}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 text-mirai-text-muted transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-border px-4 py-3">
                      <ol className="space-y-2.5">
                        {member.questions.map((q) => (
                          <li key={q.title} className="text-sm">
                            <p className="font-bold text-mirai-text">
                              {q.title}
                            </p>
                            <p className="mt-0.5 leading-relaxed text-mirai-text-secondary">
                              {q.summary}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 議案等一覧 */}
      <section id="bills" className="mt-8 scroll-mt-20">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold text-mirai-text">議案等 一覧</h2>
          <span className="text-xs text-mirai-text-muted">
            {totalBillCount}件
          </span>
        </div>

        <details className="group mt-3 rounded-lg border border-border bg-card overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-mirai-text">
            議案等 一覧を開く（{billCountLabel}）
            <ChevronDown className="h-4 w-4 shrink-0 text-mirai-text-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-border px-4 py-1">
            {preview.bills.map((bill) => (
              <div
                key={`${bill.type}-${bill.no}`}
                className="flex flex-wrap items-start gap-x-2.5 gap-y-1 border-b border-border py-2.5 text-sm last:border-b-0"
              >
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-bold ${BILL_TYPE_BADGE_CLASS[bill.type]}`}
                >
                  {bill.type}
                </span>
                <span className="shrink-0 text-xs font-bold tabular-nums text-mirai-text-muted">
                  {bill.no}
                </span>
                <span className="flex-1 min-w-[200px] text-mirai-text-secondary">
                  {bill.title}
                </span>
              </div>
            ))}
          </div>
        </details>
        <p className="mt-2 text-xs text-mirai-text-muted">
          件名は公開資料の表記のとおりです。提案理由や内容の要約は、市議会が提案理由を公開する速報段階で追記します。
        </p>
      </section>

      <p className="mt-8 rounded-md bg-mirai-surface-grouped px-3 py-2.5 text-xs leading-relaxed text-mirai-text-muted">
        この日程・質問予定・議案等は{preview.asOf}
        時点の公開資料にもとづく予定であり、変更される場合があります。みらい議会＠福津市は福津市議会が運営する公式サイトではありません。
      </p>
      <p className="mt-2 text-xs text-mirai-text-muted">
        出典：{preview.sources.map((s) => s.label).join("／")}
      </p>
    </Container>
  );
}

function formatRange(startDate: string, endDate: string | null) {
  const format = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };
  return endDate
    ? `${format(startDate)}〜${format(endDate)}`
    : `${format(startDate)}〜`;
}
