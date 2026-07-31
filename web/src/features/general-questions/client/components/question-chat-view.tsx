"use client";

import { MessageCircle, User } from "lucide-react";
import type { GeneralQuestionTopic } from "../../shared/types";

/** 議員の発言。「やり取りを追う」表示からも使う */
export function ChatBubbleQuestion({
  text,
  label,
}: {
  text: string;
  /** 「更質問」など、何回目の発言かを示すラベル */
  label?: string;
}) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="max-w-[75%]">
        {label && (
          <p className="mb-1 text-right text-xs font-medium text-mirai-text-secondary">
            {label}
          </p>
        )}
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-sm leading-relaxed">{text}</p>
        </div>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}

/** 執行部の答弁。「やり取りを追う」表示からも使う */
export function ChatBubbleAnswer({
  text,
  role,
  name,
}: {
  text: string;
  role: string;
  name: string;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mirai-surface-muted border border-border">
        <MessageCircle className="h-4 w-4 text-mirai-text-secondary" />
      </div>
      <div className="max-w-[75%]">
        <p className="mb-1 text-xs text-mirai-text-secondary">
          {role}
          {name ? `　${name}` : ""}
        </p>
        <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3">
          <p className="text-sm leading-relaxed text-mirai-text">{text}</p>
        </div>
      </div>
    </div>
  );
}

/** 論点や大項目の見出しに使う中央寄せのピル */
export function TopicChip({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto rounded-full bg-mirai-surface-muted px-3 py-1 text-center text-xs font-medium text-mirai-text-secondary">
      {children}
    </p>
  );
}

interface QuestionChatViewProps {
  topics: GeneralQuestionTopic[];
}

export function QuestionChatView({ topics }: QuestionChatViewProps) {
  return (
    <div className="flex flex-col gap-8">
      {topics.map((topic, i) => (
        <div key={`${topic.title}-${i}`} className="flex flex-col gap-3">
          <TopicChip>{topic.title}</TopicChip>
          <ChatBubbleQuestion text={topic.question_summary} />
          {topic.answer_summary ? (
            <ChatBubbleAnswer
              text={topic.answer_summary}
              role={topic.answerer_role}
              name={topic.answerer_name}
            />
          ) : (
            // 議事録が未公開の定例会は答弁が空になる。空の吹き出しを出さず理由を書く
            <p className="rounded-lg bg-mirai-surface-muted px-3 py-2 text-xs leading-relaxed text-mirai-text-secondary">
              答弁は議事録の公開後に掲載します（正式公開までおよそ3か月）。
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
