import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CouncilSession } from "../../shared/types";
import {
  countPreviewBills,
  type PreviewBillType,
  type SessionPreviewData,
} from "../data/session-preview-data";

const BILL_TYPE_BADGE_CLASS: Record<PreviewBillType, string> = {
  議案: "bg-bill-type-bill-bg border-bill-type-bill-border text-bill-type-bill-text",
  認定: "bg-bill-type-bill-bg border-bill-type-bill-border text-bill-type-bill-text",
  請願: "bg-bill-type-petition-bg border-bill-type-petition-border text-bill-type-petition-text",
  報告: "bg-bill-type-other-bg border-bill-type-other-border text-bill-type-other-text",
  同意: "bg-bill-type-other-bg border-bill-type-other-border text-bill-type-other-text",
};

function formatRange(startDate: string, endDate: string | null) {
  const format = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };
  return endDate
    ? `${format(startDate)}〜${format(endDate)}`
    : `${format(startDate)}〜`;
}

type SessionPreviewContentProps = {
  session: CouncilSession;
  preview: SessionPreviewData;
  /**
   * 見出し（headline）を h1 にするか h2 にするか。
   * 予告ページ単体（/sessions/[slug]/preview）ではそのページの主見出しなので h1。
   * トップページに埋め込むときは、ページの主見出しは別にあるので h2 にする。
   */
  headingLevel?: "h1" | "h2";
  /**
   * 会期が今日時点でまだ開催中かどうか。
   *
   * 議決結果（速報の実データ）が入るまでは同じ「予告」データを使い回すが、
   * 閉会した瞬間に「予告」「これから会期中に決まります」という言い回しが
   * 事実と食い違う（2026-09-18に発覚）。開催中/閉会後で文言を出し分ける。
   */
  isOpen: boolean;
};

/**
 * 定例会の「予告」内容（会期日程・一般質問予定・議案等一覧）。
 *
 * 予告ページ（/sessions/[slug]/preview）本体と、開会中はトップページにも
 * そのまま埋め込む（2026-09-13、「クリックしないと中身が分からない」との
 * 指摘を受けて、トップページで完結して読めるようにした）。
 */
export function SessionPreviewContent({
  session,
  preview,
  headingLevel = "h1",
  isOpen,
}: SessionPreviewContentProps) {
  const memberCount = preview.questionDays.reduce(
    (sum, day) => sum + day.members.length,
    0
  );
  const billTypeCounts = preview.bills.reduce<Record<string, number>>(
    (acc, bill) => {
      const key = bill.type;
      acc[key] = (acc[key] ?? 0) + countPreviewBills([bill]);
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
  const totalBillCount = countPreviewBills(preview.bills);
  const Headline = headingLevel;

  return (
    <div>
      <Badge variant="billReviewing">
        {isOpen
          ? "予告 — 会期日程・一般質問通告書・議案等にもとづく予定"
          : "開催済み — 議決結果は確認でき次第追記します"}
      </Badge>

      <Headline className="mt-2 text-2xl font-bold text-mirai-text leading-snug">
        {preview.headline}
      </Headline>
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
          一般質問{isOpen ? "予定" : ""}（{memberCount}名）
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
        <h3 className="text-base font-bold text-mirai-text">会期日程</h3>
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
          <h3 className="text-base font-bold text-mirai-text">
            一般質問{isOpen ? "予定 " : ""}一覧
          </h3>
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
          <h3 className="text-base font-bold text-mirai-text">議案等 一覧</h3>
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
                className="border-b border-border py-2.5 text-sm last:border-b-0"
              >
                <div className="flex flex-wrap items-start gap-x-2.5 gap-y-1">
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
                {bill.reason && (
                  <p className="mt-1.5 pl-0.5 text-xs leading-relaxed text-mirai-text-muted">
                    {bill.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </details>
        <p className="mt-2 text-xs text-mirai-text-muted">
          {isOpen
            ? "「なぜ出されたか」は議案書の記載にもとづく要約です。賛否・議決結果はまだ無く、これから会期中に決まります。議案の詳しい内容や答弁の要約は、議決結果と合わせて公開する速報段階で追記します。"
            : "「なぜ出されたか」は議案書の記載にもとづく要約です。会期は閉会しましたが、議決結果（可決・否決・認定等）はまだ確認できていません。確認でき次第、結果と合わせて追記します。"}
        </p>
      </section>

      <p className="mt-8 rounded-md bg-mirai-surface-grouped px-3 py-2.5 text-xs leading-relaxed text-mirai-text-muted">
        {isOpen
          ? `この日程・質問予定・議案等は${preview.asOf}時点の公開資料にもとづく予定であり、変更される場合があります。`
          : `この日程・一般質問・議案等一覧は、会期中の公開資料（${preview.asOf}時点）にもとづく記録です。議決結果はまだ反映していません。`}
        みらい議会＠福津市は福津市議会が運営する公式サイトではありません。
      </p>
      <p className="mt-2 text-xs text-mirai-text-muted">
        出典：{preview.sources.map((s) => s.label).join("／")}
      </p>
    </div>
  );
}
