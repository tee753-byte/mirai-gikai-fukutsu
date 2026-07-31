"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { GeneralQuestionTopic } from "../../shared/types";
import { QuestionChatView } from "./question-chat-view";
import { QuestionDigestView } from "./question-digest-view";
import { RawTranscriptView } from "./raw-transcript-view";

type ViewMode = "summary" | "digest" | "raw";

interface QuestionDetailViewProps {
  topics: GeneralQuestionTopic[];
  rawText: string | null;
}

/**
 * 一般質問の詳細を3段階で切り替える。
 *   要約         … 通告の質問要旨と第一答弁だけ。いちばん短い
 *   やり取りを追う … 論点ごとに更質問まで含めた往復の要約
 *   詳しく（原文） … 会議録そのまま。1人あたり2万字前後
 * 最初は必ず要約を見せて、読みたい人だけ先へ進めるようにしている。
 */
export function QuestionDetailView({
  topics,
  rawText,
}: QuestionDetailViewProps) {
  const [mode, setMode] = useState<ViewMode>("summary");

  const hasSummary = topics.length > 0;
  const hasDigest = topics.some((t) => (t.exchanges?.length ?? 0) > 0);
  const hasRaw = Boolean(rawText);

  const available: ViewMode[] = [
    ...(hasSummary ? (["summary"] as const) : []),
    ...(hasDigest ? (["digest"] as const) : []),
    ...(hasRaw ? (["raw"] as const) : []),
  ];

  // 使えるビューが1つだけなら切り替えボタンを出さない
  const showSwitch = available.length > 1;
  const activeMode = available.includes(mode) ? mode : available[0];

  return (
    <div className="flex flex-col gap-6">
      {showSwitch && (
        <div className="flex flex-wrap gap-2">
          {available.map((m) => (
            <TabButton
              key={m}
              isActive={activeMode === m}
              onClick={() => setMode(m)}
            >
              {MODE_LABELS[m]}
            </TabButton>
          ))}
        </div>
      )}

      {activeMode === "summary" && <QuestionChatView topics={topics} />}

      {activeMode === "digest" && <QuestionDigestView topics={topics} />}

      {activeMode === "raw" && rawText && (
        <div className="flex flex-col gap-4">
          <p className="text-xs leading-relaxed text-mirai-text-secondary">
            公式会議録の発言をそのまま掲載しています（議事進行の発言は省略）。
          </p>
          <RawTranscriptView rawText={rawText} />
        </div>
      )}
    </div>
  );
}

const MODE_LABELS: Record<ViewMode, string> = {
  summary: "要約",
  digest: "やり取りを追う",
  raw: "詳しく（原文）",
};

function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-mirai-text hover:bg-mirai-surface-muted"
      )}
    >
      {children}
    </button>
  );
}
