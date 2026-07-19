"use client";

import { BookOpenText, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CommitteeSpeech } from "../../shared/types";
import type { TranscriptSection } from "../../shared/utils/build-transcript-sections";
import { isNameCallSpeech } from "../../shared/utils/normalize-speeches";
import { splitSpeechSegments } from "../../shared/utils/split-speech-segments";

type Props = {
  sections: TranscriptSection[];
};

const SPEAKER_TYPE_LABEL: Record<CommitteeSpeech["speakerType"], string> = {
  chairperson: "委員長",
  member: "委員",
  executive: "県の担当者",
  unknown: "記録",
};

/** 執行部（答える側）を右、委員・委員長（聞く側）を左に出す */
function isRightSide(speech: CommitteeSpeech): boolean {
  return speech.speakerType === "executive";
}

function SpeechBubbles({
  speech,
  detailMode,
}: {
  speech: CommitteeSpeech;
  detailMode: boolean;
}) {
  // 指名だけの発言は吹き出しにせず、場内の進行として小さく表示する
  if (isNameCallSpeech(speech)) {
    return (
      <p className="text-center text-xs text-mirai-text-muted">
        ▷ {speech.text}
      </p>
    );
  }

  const right = isRightSide(speech);
  const body = detailMode ? speech.text : (speech.simpleText ?? speech.text);
  const segments = splitSpeechSegments(body);
  // 冒頭が〔場内の様子〕で始まる発言でもラベルを出せるよう、最初の本文位置を使う
  const firstTextIndex = segments.findIndex((s) => s.kind === "text");

  return (
    <div className="space-y-2">
      {segments.map((segment, i) =>
        segment.kind === "interjection" ? (
          <p
            key={`${speech.voiceNo}-${i}`}
            className="text-center text-xs text-mirai-text-muted"
          >
            ―― {segment.content} ――
          </p>
        ) : (
          <div
            key={`${speech.voiceNo}-${i}`}
            className={`flex ${right ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] ${right ? "text-right" : ""}`}>
              {i === firstTextIndex && speech.speakerLabel && (
                <div
                  className={`mb-1 flex items-center gap-1.5 text-xs ${
                    right ? "justify-end" : ""
                  }`}
                >
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      right
                        ? "bg-mirai-surface-grouped text-mirai-text-secondary"
                        : "bg-mirai-gradient-start text-primary-accent"
                    }`}
                  >
                    {SPEAKER_TYPE_LABEL[speech.speakerType]}
                  </span>
                  <span className="font-bold text-mirai-text">
                    {speech.speakerLabel}
                  </span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-left text-sm text-mirai-text-secondary leading-relaxed whitespace-pre-wrap border ${
                  right
                    ? "rounded-tr-sm bg-white border-mirai-border"
                    : "rounded-tl-sm bg-mirai-gradient-end border-mirai-gradient-start"
                }`}
              >
                {segment.content}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export function ChatTranscript({ sections }: Props) {
  const [detailMode, setDetailMode] = useState(false);
  const hasSimpleText = sections.some((section) =>
    section.speeches.some((s) => s.simpleText)
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          aria-pressed={!detailMode}
          variant={detailMode ? "outline" : "default"}
          size="sm"
          onClick={() => setDetailMode(false)}
        >
          <MessageCircle className="w-4 h-4" />
          わかりやすい表現
        </Button>
        <Button
          aria-pressed={detailMode}
          variant={detailMode ? "default" : "outline"}
          size="sm"
          onClick={() => setDetailMode(true)}
        >
          <BookOpenText className="w-4 h-4" />
          詳しく（原文）
        </Button>
        {!detailMode && !hasSimpleText && (
          <p className="w-full text-xs text-mirai-text-muted">
            わかりやすい表現は現在準備中のため、原文を表示しています。
          </p>
        )}
      </div>

      <div className="flex flex-col gap-10">
        {sections.map((section) => (
          <section
            key={section.topic?.id ?? "opening"}
            id={section.topic ? `topic-${section.topic.topicOrder}` : undefined}
            className="scroll-mt-24 flex flex-col gap-4"
          >
            <h2 className="rounded-full bg-mirai-surface-grouped px-4 py-2 text-sm font-bold text-mirai-text leading-relaxed w-fit">
              {section.topic
                ? `${section.topic.topicOrder}. ${section.topic.title}`
                : "開会・はじめの手続き"}
            </h2>
            {section.speeches.map((speech, i) => (
              <SpeechBubbles
                key={`${speech.voiceNo}-${i}`}
                speech={speech}
                detailMode={detailMode}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
