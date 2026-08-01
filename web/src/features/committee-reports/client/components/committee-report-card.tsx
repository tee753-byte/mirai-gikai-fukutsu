"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BillStatusBadge } from "@/features/bills/client/components/bill-list/bill-status-badge";
import type { CommitteeReportBillReview } from "../../shared/types";

type CommitteeReportCardProps = {
  review: CommitteeReportBillReview;
  sourceUrl: string;
};

export function CommitteeReportCard({
  review,
  sourceUrl,
}: CommitteeReportCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/*
        議案番号とバッジを必ず同じ行に置く。以前はタイトルと横並びにしていたが、
        タイトルの長さによってバッジが下に回り込み、カードごとに位置が変わっていた
      */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-mirai-text-muted">{review.billNumber}</p>
        <BillStatusBadge status={review.outcome} className="shrink-0" />
      </div>
      <h3 className="font-bold text-mirai-text leading-snug mt-1">
        {review.billTitle}
      </h3>

      <p className="mt-2 text-sm text-mirai-text-secondary">
        審査結果: {review.result}
      </p>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary-accent hover:opacity-70">
          委員会での主なやり取りを見る
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          {review.qa.map((qa) => (
            <div
              key={qa.question}
              className="border-l-2 border-primary-accent pl-3 py-1"
            >
              <p className="text-sm font-semibold text-mirai-text">
                質疑: {qa.question}
              </p>
              <p className="mt-1 text-sm text-mirai-text-secondary">
                答弁: {qa.answer}
              </p>
            </div>
          ))}

          {review.opinions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-mirai-text">主な意見</p>
              {review.opinions.map((opinion) => (
                <p
                  key={opinion}
                  className="mt-1 text-sm text-mirai-text-secondary"
                >
                  {opinion}
                </p>
              ))}
            </div>
          )}

          <Link
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-mirai-text-muted hover:text-mirai-text"
          >
            <ExternalLink className="w-3 h-3" />
            委員会審査報告書（原本PDF）
          </Link>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
