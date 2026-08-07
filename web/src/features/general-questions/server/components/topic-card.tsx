"use client";

import { ArrowRight, ChevronDown, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MINUTES_PUBLICATION_TIMING } from "@/features/council-sessions/shared/minutes-schedule";
import type { TopicEntry } from "../../shared/utils/build-topic-groups";

export type TopicCardStyle = {
  card: string;
  header: string;
  text: string;
  iconBg: string;
};

// 一覧をざっと見渡せるように本文は3行に畳んでおき、続きが読みたい人だけ
// 「もっと読む」で開く。何文字からはみ出すかはカード幅次第で厳密には測れないため、
// 短い文章でもボタンは出るが、押しても見た目が変わらないだけで実害はない。
const TRUNCATE_THRESHOLD = 70;

export function TopicCard({
  entry,
  style,
}: {
  entry: TopicEntry;
  style: TopicCardStyle;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bodyText = entry.answerSummary || entry.questionSummary;
  const canExpand = bodyText.length > TRUNCATE_THRESHOLD;

  return (
    <div className={`rounded-xl border ${style.card} overflow-hidden`}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-2 mb-2">
          <h3 className={`text-base font-bold ${style.text} flex-1`}>
            {entry.title}
          </h3>
          {entry.topicCount > 1 && (
            <span
              className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full ${style.iconBg} ${style.text}`}
            >
              {entry.topicCount}件
            </span>
          )}
        </div>

        <p
          className={`text-sm text-mirai-text leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}
        >
          {bodyText}
        </p>

        {canExpand && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`mt-1 inline-flex items-center gap-0.5 text-xs font-medium ${style.text} hover:underline`}
          >
            {isExpanded ? "閉じる" : "もっと読む"}
            <ChevronDown
              className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}

        {!entry.answerSummary && (
          <p className="mt-2 inline-flex items-start gap-1 rounded-md bg-white/70 px-2 py-1 text-[11px] leading-relaxed text-mirai-text-secondary">
            <Clock className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              答弁は会議録の公開後に追加します（{MINUTES_PUBLICATION_TIMING}
              ）。それまでは質問の要旨のみを掲載しています。
            </span>
          </p>
        )}
      </div>
      <div
        className={`px-4 py-2.5 border-t ${style.header} flex items-center justify-between gap-2`}
      >
        <p className="text-xs text-mirai-text-secondary line-clamp-1 flex-1">
          {entry.questioner.name}議員の質問より
        </p>
        <Link
          href={`/questions/${entry.questioner.id}`}
          className={`inline-flex items-center gap-1 text-xs font-medium ${style.text} hover:underline shrink-0`}
        >
          質疑の詳細
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
