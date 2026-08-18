"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { GeneralQuestion } from "@/features/general-questions/shared/types";

function TopicTag({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-mirai-text border-border hover:border-primary hover:text-primary"
      }`}
    >
      {label}
      <span
        className={`text-xs rounded-full px-1.5 py-0.5 ${
          selected
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-mirai-surface-muted text-mirai-text-secondary"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function QuestionerCard({
  question,
  highlightTopics,
}: {
  question: GeneralQuestion;
  highlightTopics: Set<string>;
}) {
  const dayLabel = `第${question.session_day}日`;
  const matchedTopics = question.topics.filter((t) =>
    highlightTopics.size === 0 ? true : highlightTopics.has(t.title)
  );
  const otherTopics = question.topics.filter(
    (t) => !highlightTopics.has(t.title)
  );

  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-mirai-text">
              {question.questioner_name}
            </span>
            <span className="text-xs text-mirai-text-secondary">
              {question.questioner_party}
            </span>
          </div>
          <p className="text-xs text-mirai-text-secondary mb-3">
            {dayLabel}・{question.question_order}番目
          </p>

          {/* マッチしたトピック（強調） */}
          {highlightTopics.size > 0 && matchedTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {matchedTopics.map((t) => (
                <Badge
                  key={t.title}
                  className="bg-primary/10 text-primary border-primary/30 text-xs"
                >
                  {t.title}
                </Badge>
              ))}
            </div>
          )}

          {/* その他のトピック */}
          <div className="flex flex-wrap gap-1.5">
            {(highlightTopics.size === 0 ? question.topics : otherTopics).map(
              (t) => (
                <Badge
                  key={t.title}
                  variant="secondary"
                  className="text-xs text-mirai-text-secondary"
                >
                  {t.title}
                </Badge>
              )
            )}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-mirai-text-muted mt-1" />
      </div>
    </div>
  );
}

export function OverviewClient({
  questions,
}: {
  questions: GeneralQuestion[];
}) {
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  // トピック集計
  const topicCounts = new Map<string, number>();
  for (const q of questions) {
    for (const t of q.topics) {
      topicCounts.set(t.title, (topicCounts.get(t.title) ?? 0) + 1);
    }
  }
  const sortedTopics = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]);

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  }

  // 絞り込み
  const filtered =
    selectedTopics.size === 0
      ? questions
      : questions.filter((q) =>
          q.topics.some((t) => selectedTopics.has(t.title))
        );

  return (
    <div className="space-y-6">
      {/* テーマタグ */}
      <div>
        <p className="text-xs font-medium text-mirai-text-secondary mb-3">
          テーマで絞り込む（複数選択可）
        </p>
        <div className="flex flex-wrap gap-2">
          {sortedTopics.map(([topic, count]) => (
            <TopicTag
              key={topic}
              label={topic}
              count={count}
              selected={selectedTopics.has(topic)}
              onClick={() => toggleTopic(topic)}
            />
          ))}
        </div>
        {selectedTopics.size > 0 && (
          <button
            type="button"
            onClick={() => setSelectedTopics(new Set())}
            className="mt-3 text-xs text-mirai-text-secondary underline hover:text-mirai-text"
          >
            絞り込みをクリア
          </button>
        )}
      </div>

      {/* 件数 */}
      <p className="text-sm text-mirai-text-secondary">
        {filtered.length} 件 / {questions.length} 件中
      </p>

      {/* 議員カード一覧 */}
      <div className="flex flex-col gap-3">
        {filtered.map((q) => (
          <QuestionerCard
            key={q.id}
            question={q}
            highlightTopics={selectedTopics}
          />
        ))}
      </div>
    </div>
  );
}
