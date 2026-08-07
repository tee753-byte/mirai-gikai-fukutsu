import Image from "next/image";
import { Card } from "@/components/ui/card";
import { formatDateJST } from "@/lib/utils/date";
import type { BillWithContent } from "../../../shared/types";
import { getBillThumbnail } from "../../../shared/utils/tag-thumbnail";
import { BillStatusBadge } from "./bill-status-badge";
import { BillTypeBand } from "./bill-type-band";
import { VoteCountBadge } from "./vote-count-badge";

interface CompactBillCardProps {
  bill: BillWithContent;
  className?: string;
}

/**
 * コンパクトな水平レイアウトの議案カード
 * 過去定例会セクションや過去定例会議案一覧ページで使用
 */
export function CompactBillCard({ bill, className }: CompactBillCardProps) {
  const displayTitle = bill.bill_content?.title || bill.name;
  const statusLabel = "提出";
  const thumbnailUrl = bill.thumbnail_url ?? getBillThumbnail(bill);

  return (
    <Card
      className={`border-[0.5px] border-mirai-text-placeholder rounded-2xl shadow-none hover:bg-muted/50 transition-colors overflow-hidden ${className ?? ""}`}
    >
      {/* 種別の色帯。カードの左端から右端までいっぱいに引く */}
      <BillTypeBand billType={bill.bill_type} billNumber={bill.bill_number} />

      <div className="flex">
        {/* コンテンツエリア */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          <h3 className="font-bold text-[15px] leading-[1.6] line-clamp-2">
            {displayTitle}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <BillStatusBadge
              status={bill.status}
              billType={bill.bill_type}
              className="w-fit"
            />
            {bill.voteCounts && <VoteCountBadge voteCounts={bill.voteCounts} />}
            {bill.published_at && (
              <span className="text-xs text-muted-foreground">
                {formatDateJST(bill.published_at)} {statusLabel}
              </span>
            )}
          </div>
        </div>

        {/* サムネイル画像。個別設定が無ければタグに応じたデフォルト画像を表示する */}
        {thumbnailUrl && (
          <div className="relative w-24 h-16 flex-shrink-0 self-center mr-4 rounded-lg overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt={bill.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
