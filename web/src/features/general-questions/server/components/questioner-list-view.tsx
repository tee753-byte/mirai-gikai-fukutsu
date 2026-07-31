import { ChevronRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { QuestionerGroup } from "../../shared/utils/build-questioner-groups";

/**
 * 議員一覧。
 * 掲載基準は全議員で統一し、質問回数や発言量では並べ替えない
 * （CLAUDE.md の「特定の議員を強調しない」）。
 */
export function QuestionerListView({ groups }: { groups: QuestionerGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="py-16 text-center text-mirai-text-secondary">
        <p>現在、一般質問のデータを準備中です。</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {groups.map((g) => (
        <li key={g.slug}>
          <Link
            href={`/questions/members/${encodeURIComponent(g.slug)}`}
            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-mirai-surface-grouped"
          >
            <div className="min-w-0">
              <p className="font-bold text-mirai-text">{g.name}</p>
              <p className="mt-0.5 text-xs text-mirai-text-secondary">
                {g.party ?? "会派情報なし"}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-mirai-text-secondary">
                <MessageSquare className="h-3 w-3 shrink-0" />
                {g.entries.length}回の定例会 ・ {g.topicCount}件の質問事項
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-mirai-text-muted transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
