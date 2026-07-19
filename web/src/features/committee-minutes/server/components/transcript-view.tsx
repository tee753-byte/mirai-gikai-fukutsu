import "server-only";
import { ArrowDown, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ChatTranscript } from "../../client/components/chat-transcript";
import type { CommitteeMeetingDetail } from "../../shared/types";
import { buildTranscriptSections } from "../../shared/utils/build-transcript-sections";
import { formatJapaneseDate } from "../../shared/utils/format-japanese-date";
import { normalizeSpeeches } from "../../shared/utils/normalize-speeches";

type Props = {
  meeting: CommitteeMeetingDetail;
};

export function TranscriptView({ meeting }: Props) {
  const sections = buildTranscriptSections(
    normalizeSpeeches(meeting.speeches),
    meeting.topics
  );
  const topicSections = sections.filter((s) => s.topic !== null);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/committees/${meeting.committeeSlug}/${meeting.sourceDocumentId}`}
          className="inline-flex items-center gap-1 text-sm text-mirai-text-muted hover:text-mirai-text"
        >
          <ArrowLeft className="size-3.5" />
          会議のまとめへ戻る
        </Link>
        <h1 className="mt-3 text-xl sm:text-2xl font-bold text-mirai-text">
          発言のやり取り
        </h1>
        <p className="mt-1 text-sm text-mirai-text-secondary">
          {meeting.committeeName}・{formatJapaneseDate(meeting.meetingDate)}{" "}
          開催
        </p>
      </div>

      {topicSections.length > 0 && (
        <nav className="rounded-2xl bg-gradient-to-br from-mirai-gradient-start to-mirai-gradient-end p-5">
          <h2 className="text-sm font-bold text-mirai-text">目次</h2>
          <ol className="mt-3 space-y-2">
            {topicSections.map((section) => (
              <li key={section.topic?.id}>
                <a
                  href={`#topic-${section.topic?.topicOrder}`}
                  className="inline-flex items-start gap-1.5 text-sm text-primary-accent hover:underline"
                >
                  <ArrowDown className="mt-1 w-3.5 h-3.5 shrink-0" />
                  <span>
                    {section.topic?.topicOrder}. {section.topic?.title}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <ChatTranscript sections={sections} />

      <p className="text-xs text-mirai-text-muted">
        出典:{" "}
        <a
          href={meeting.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary-accent hover:underline"
        >
          福岡県議会 会議録検索システム
          <ExternalLink className="size-3" />
        </a>
      </p>
    </div>
  );
}
