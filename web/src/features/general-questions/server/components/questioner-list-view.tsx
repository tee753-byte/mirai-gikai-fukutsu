import { ChevronRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { findMemberProfile } from "@/features/council-members/shared/member-profiles";
import type { QuestionerGroup } from "../../shared/utils/build-questioner-groups";
import { groupQuestionersByParty } from "../../shared/utils/group-questioners-by-party";

/**
 * 議員一覧。会派ごとにセクションを分けて表示する（無所属を先頭に固定）。
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

  const partyGroups = groupQuestionersByParty(groups);

  return (
    <div className="flex flex-col gap-8">
      {partyGroups.map(({ partyLabel, members }) => (
        <section key={partyLabel}>
          <h2 className="mb-3 text-sm font-bold text-mirai-text-secondary">
            {partyLabel}（{members.length}人）
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {members.map((g) => {
              // どの委員会に属しているかは、その議員が扱う分野に直結するため一覧にも出す
              const profile = findMemberProfile(g.name);

              return (
                <li key={g.slug}>
                  <Link
                    href={`/questions/members/${encodeURIComponent(g.slug)}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-mirai-surface-grouped"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-mirai-text">{g.name}</p>
                      {profile?.committee ? (
                        <p className="mt-1 text-xs text-mirai-text-secondary">
                          {profile.committee}
                        </p>
                      ) : (
                        // 議長は常任委員会に所属しないため委員会名が無い。
                        // （副議長は質問できる立場なので対象外）
                        profile?.role === "議長" && (
                          <p className="mt-1 text-xs text-mirai-text-secondary">
                            議長
                          </p>
                        )
                      )}
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-mirai-text-secondary">
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        {profile?.role === "議長"
                          ? "議事進行のため質問は行いません"
                          : `${g.entries.length}回の定例会`}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-mirai-text-muted transition-transform group-hover:translate-x-0.5" />
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
