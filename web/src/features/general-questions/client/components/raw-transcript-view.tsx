import { MessageCircle, User } from "lucide-react";
import {
  isQuestionerSpeaker,
  parseSpeakerTurns,
} from "../../shared/utils/parse-speaker-turns";

/**
 * 会議録の原文をそのまま吹き出しで並べる。
 * 更質問（２回目以降の質問）まで含めて、実際のやり取りの往復が分かるようにするためのビュー。
 */
export function RawTranscriptView({ rawText }: { rawText: string }) {
  const turns = parseSpeakerTurns(rawText);

  return (
    <div className="flex flex-col gap-4">
      {turns.map((turn, i) => {
        const isQuestioner = isQuestionerSpeaker(turn.speaker);
        return (
          <div
            key={`${i}-${turn.speaker}`}
            className={`flex items-start gap-2 ${
              isQuestioner ? "justify-end" : ""
            }`}
          >
            {/* 答弁者アイコン（左） */}
            {!isQuestioner && (
              <div className="mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-mirai-surface-muted">
                <MessageCircle className="h-4 w-4 text-mirai-text-secondary" />
              </div>
            )}

            <div className="max-w-[80%]">
              <p
                className={`mb-1 text-xs font-medium text-mirai-text-secondary ${
                  isQuestioner ? "text-right" : ""
                }`}
              >
                {turn.speaker}
              </p>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  isQuestioner
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border border-border bg-card text-mirai-text"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {turn.text}
                </p>
              </div>
            </div>

            {/* 質問した議員のアイコン（右） */}
            {isQuestioner && (
              <div className="mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
