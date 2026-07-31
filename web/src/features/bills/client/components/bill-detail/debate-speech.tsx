"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  stance: "for" | "against";
  speakerName: string;
  speakerNumber: string | null;
  speakerParty: string | null;
  rawText: string | null;
};

/** 討論は1人あたり300〜1,000字あるので、最初は数行だけ見せて開けるようにする */
const PREVIEW_LENGTH = 90;

export function DebateSpeech({
  stance,
  speakerName,
  speakerNumber,
  speakerParty,
  rawText,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const text = rawText ?? "";
  const needsToggle = text.length > PREVIEW_LENGTH;
  const isFor = stance === "for";

  return (
    <div
      className={`rounded-lg border p-3 ${
        isFor
          ? "border-bill-approved-border bg-bill-approved-bg"
          : "border-bill-rejected-border bg-bill-rejected-bg"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
            isFor ? "text-bill-approved-text" : "text-bill-rejected-text"
          }`}
        >
          {isFor ? "賛成" : "反対"}
        </span>
        <span className="font-bold text-mirai-text">{speakerName} 議員</span>
        <span className="text-xs text-mirai-text-secondary">
          {speakerNumber ? `${speakerNumber}番` : ""}
          {speakerParty ? `　${speakerParty}` : ""}
        </span>
      </div>

      {text && (
        <>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-mirai-text">
            {isOpen || !needsToggle
              ? text
              : `${text.slice(0, PREVIEW_LENGTH)}…`}
          </p>
          {needsToggle && (
            <Button
              type="button"
              variant="link"
              onClick={() => setIsOpen((v) => !v)}
              className="mt-2 h-auto gap-1 p-0 text-xs font-medium text-mirai-text-secondary no-underline hover:underline"
            >
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {isOpen ? "とじる" : "発言の全文を読む"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
