import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { MINUTES_PUBLICATION_TIMING } from "@/features/council-sessions/shared/minutes-schedule";
import type { SessionWithQuestions } from "../loaders/get-sessions-with-questions";

type Props = {
  sessions: SessionWithQuestions[];
  /** いま開いている定例会 */
  currentSlug: string;
};

/**
 * 定例会を切り替えるための並び。
 *
 * 会議録は定例会の3か月ほど後に公開されるため、直近の定例会を開くと
 * 質問の項目だけが並び「中身が無いサイト」に見えてしまう。
 * 他の定例会にはやり取りまで載っていることを、件数付きでその場に示す。
 */
export function SessionQuestionsSwitcher({ sessions, currentSlug }: Props) {
  if (sessions.length <= 1) return null;

  const current = sessions.find((s) => s.slug === currentSlug);
  // やり取りまで載っている、いま見ているものより1つ前の定例会
  const previousWithTranscript = sessions.find(
    (s) => s.slug !== currentSlug && s.transcriptCount > 0
  );
  const currentHasNoTranscript = current
    ? current.transcriptCount === 0
    : false;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-bold text-mirai-text">
        定例会を切り替える
      </p>
      <div className="flex flex-wrap gap-2">
        {sessions.map((s) => {
          const isCurrent = s.slug === currentSlug;
          return (
            <Link
              key={s.slug}
              href={`/sessions/${s.slug}/questions`}
              aria-current={isCurrent ? "page" : undefined}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                isCurrent
                  ? "bg-primary text-white"
                  : "bg-mirai-surface-grouped text-mirai-text-secondary hover:bg-mirai-surface-muted"
              }`}
            >
              {s.name.replace(/\s+/g, "")}（{s.questionCount}件）
            </Link>
          );
        })}
      </div>

      {currentHasNoTranscript && previousWithTranscript && (
        <div className="mt-3 rounded-lg bg-mirai-surface-grouped px-4 py-3">
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-mirai-text-secondary">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              この定例会は、まだ会議録が公開されていないため
              <strong className="font-bold text-mirai-text">
                質問の項目だけ
              </strong>
              を載せています（{MINUTES_PUBLICATION_TIMING}に公開されます）。
            </span>
          </p>
          <Link
            href={`/sessions/${previousWithTranscript.slug}/questions`}
            className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            やり取りまで読める{previousWithTranscript.name.replace(/\s+/g, "")}
            を見る
            <ArrowRight className="h-3 w-3 shrink-0" />
          </Link>
        </div>
      )}
    </div>
  );
}
