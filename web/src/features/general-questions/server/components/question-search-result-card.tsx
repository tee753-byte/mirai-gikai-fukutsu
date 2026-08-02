import { ArrowRight, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { highlightKeywords } from "../../shared/utils/highlight-keywords";
import type { GeneralQuestionSearchHit } from "../loaders/search-general-questions";

/**
 * 検索結果に出す一般質問1件分のカード。
 *
 * 議案のカードと並べて表示するため、ひと目で「これは一般質問」と分かるように
 * 上端の帯で区別する。議案の種別バッジと同じ考え方。
 */
export function QuestionSearchResultCard({
  question,
  keywords = [],
}: {
  question: GeneralQuestionSearchHit;
  /** 検索に使った語。抜粋と見出しの中で印をつける */
  keywords?: string[];
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-mirai-surface-grouped px-4 py-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-mirai-text-secondary">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          一般質問
        </span>
        <span className="text-xs text-mirai-text-muted">
          {question.sessionName}
        </span>
      </div>

      <div className="p-4">
        <p className="font-bold text-mirai-text">
          {question.questionerName} 議員
        </p>

        {question.topicTitles.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {question.topicTitles.map((title) => (
              <li
                key={title}
                className="text-sm text-mirai-text-secondary before:mr-1.5 before:content-['・']"
              >
                {highlightKeywords(title, keywords)}
              </li>
            ))}
          </ul>
        )}

        {/* なぜこの質問が引っかかったのかを示す。見出しに無い語で当たることが多い */}
        {question.excerpt && (
          <p className="mt-3 rounded-md bg-mirai-surface-grouped px-3 py-2 text-xs leading-relaxed text-mirai-text-secondary">
            {highlightKeywords(question.excerpt, keywords)}
          </p>
        )}

        {!question.hasTranscript && (
          <p className="mt-3 inline-flex items-start gap-1 text-[11px] leading-relaxed text-mirai-text-muted">
            <Clock className="mt-0.5 h-3 w-3 shrink-0" />
            やり取りの全文は、会議録の公開後に掲載します。
          </p>
        )}

        <Link
          href={`/questions/${question.id}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
        >
          {question.hasTranscript ? "質疑のやり取りを読む" : "質問の内容を見る"}
          <ArrowRight className="h-3 w-3 shrink-0" />
        </Link>
      </div>
    </article>
  );
}
