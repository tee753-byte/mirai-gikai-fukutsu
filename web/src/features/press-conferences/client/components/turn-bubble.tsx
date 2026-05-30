"use client";

import type { PressConferenceTurn } from "../../shared/types";

type Props = {
  turn: PressConferenceTurn;
};

export function TurnBubble({ turn }: Props) {
  const isGovernor = turn.speaker === "governor";

  return (
    <div
      className={`flex gap-3 ${isGovernor ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className="flex-shrink-0 mt-1">
        <div
          className={`w-9 h-9 rounded-full flex flex-col items-center justify-center text-[10px] font-bold leading-tight shadow-sm ${
            isGovernor
              ? "bg-gradient-to-br from-mirai-gradient-start to-primary text-primary-accent"
              : "bg-mirai-surface-warm text-mirai-text-muted border border-mirai-border"
          }`}
        >
          {isGovernor ? (
            <span className="text-base leading-none">🏛️</span>
          ) : (
            <span className="text-base leading-none">🎤</span>
          )}
        </div>
      </div>
      <div
        className={`flex flex-col gap-1 max-w-[85%] ${isGovernor ? "items-end" : "items-start"}`}
      >
        <span className="text-xs font-medium text-mirai-text-muted px-1">
          {isGovernor ? "服部知事" : "記者"}
        </span>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed text-mirai-text shadow-sm ${
            isGovernor
              ? "bg-gradient-to-br from-mirai-gradient-end to-mirai-gradient-start rounded-tr-sm"
              : "bg-white border border-mirai-border rounded-tl-sm"
          }`}
        >
          {turn.content}
        </div>
      </div>
    </div>
  );
}
