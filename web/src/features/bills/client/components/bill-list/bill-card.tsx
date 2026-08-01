import Image from "next/image";
import { RubySafeLineClamp } from "@/components/ruby-safe-line-clamp";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateJST } from "@/lib/utils/date";
import type { BillWithContent } from "../../../shared/types";
import { BillStatusBadge } from "./bill-status-badge";
import { BillTag } from "./bill-tag";
import { BillTypeBand } from "./bill-type-band";
import { VoteCountBadge } from "./vote-count-badge";

interface BillCardProps {
  bill: BillWithContent;
}

export function BillCard({ bill }: BillCardProps) {
  const displayTitle = bill.bill_content?.title;
  const summary = bill.bill_content?.summary;

  return (
    <Card className="border border-black hover:bg-muted/50 transition-colors relative overflow-hidden max-w-[634px]">
      <div className="flex flex-col">
        {/* 種別の色帯。カードの左端から右端までいっぱいに引く */}
        <BillTypeBand billType={bill.bill_type} billNumber={bill.bill_number} />

        {/* 注目バッジエリア */}
        {bill.is_featured && (
          <div
            className={`${bill.thumbnail_url != null ? "absolute" : "relative"} top-3 left-3 z-1`}
          >
            <span className="inline-flex items-center justify-center px-3 py-0.5 text-xs font-medium text-mirai-text bg-mirai-highlight rounded-[20px]">
              注目🔥
            </span>
          </div>
        )}

        {/* サムネイル画像 */}
        {bill.thumbnail_url && (
          <div className="relative w-full h-52 md:h-65">
            <Image
              src={bill.thumbnail_url}
              alt={bill.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}

        {/* コンテンツエリア */}
        <div className="flex-1">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <CardTitle className="text-2xl/8 tracking-normal">
                {displayTitle}
              </CardTitle>
              <div className="flex flex-row items-center gap-2">
                <BillStatusBadge
                  status={bill.status}
                  billType={bill.bill_type}
                  className="w-fit"
                />
                {bill.voteCounts && (
                  <VoteCountBadge voteCounts={bill.voteCounts} />
                )}
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {bill.published_at && (
                    <time>{formatDateJST(bill.published_at)} 提出</time>
                  )}
                </div>
              </div>
              <RubySafeLineClamp
                text={summary}
                maxLength={132}
                lineClamp={4}
                className="text-sm leading-relaxed"
              />
              {/* タグ表示 */}
              {bill.tags && bill.tags.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {bill.tags.map((tag) => (
                    <BillTag key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
        </div>
      </div>
    </Card>
  );
}
