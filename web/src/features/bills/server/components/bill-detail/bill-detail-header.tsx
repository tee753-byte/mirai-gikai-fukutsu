import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";
import { formatDateJST } from "@/lib/utils/date";
import { BillDetailShareButton } from "../../../client/components/bill-detail/bill-detail-share-button";
import { BillStatusBadge } from "../../../client/components/bill-list/bill-status-badge";
import { BillTag } from "../../../client/components/bill-list/bill-tag";
import { BillTypeBadge } from "../../../client/components/bill-list/bill-type-badge";
import { getBillShareData } from "../../../client/utils/share";
import type { BillWithContent } from "../../../shared/types";

interface BillDetailHeaderProps {
  bill: BillWithContent;
  hasInterviewConfig?: boolean;
}

export async function BillDetailHeader({
  bill,
  hasInterviewConfig,
}: BillDetailHeaderProps) {
  const displayTitle = bill.bill_content?.title;
  const displaySummary = bill.bill_content?.summary;

  const { shareUrl, shareMessage, thumbnailUrl } = await getBillShareData(bill);

  return (
    <div className="mb-8 bg-white rounded-b-4xl">
      {bill.thumbnail_url ? (
        <div className="relative w-full h-72 md:h-80">
          <Image
            src={bill.thumbnail_url}
            alt={bill.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </div>
      ) : (
        <div className="w-full h-20 bg-white-100" />
      )}

      <div className="px-4 pt-8 mb-3">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <BillTypeBadge billType={bill.bill_type} />
          {bill.bill_number && (
            <p className="text-xs font-medium text-muted-foreground">
              {bill.bill_number}
            </p>
          )}
        </div>
        {displayTitle && (
          <h1 className="text-2xl font-bold mb-3">{displayTitle}</h1>
        )}
        <div className="flex flex-row gap-4">
          <BillStatusBadge
            status={bill.status}
            billType={bill.bill_type}
            className="w-fit"
          />
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {bill.published_at && (
              <time>{formatDateJST(bill.published_at)} 提出</time>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-8">
        {displaySummary && (
          <p className="mb-4 leading-relaxed">{displaySummary}</p>
        )}

        {bill.source_url && (
          <a
            href={bill.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {/* 福津市は議案書を公開しておらず、リンク先は市の定例会ページなので
                「原文（PDF）」とは書かない */}
            市の公式ページで確認する
          </a>
        )}

        {/* タグ表示。ここはカードの中ではないので、押すと同じ分野の議案を探せる */}
        {bill.tags && bill.tags.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {bill.tags.map((tag) => (
              <BillTag key={tag.id} tag={tag} linkToSearch />
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground font-medium mb-4">
          {bill.name}
        </p>
        <div className="flex items-center gap-2">
          {hasInterviewConfig && (
            <Button
              variant="default"
              size="sm"
              asChild
              className="bg-mirai-light-gradient text-[13px] font-bold text-gray-800 gap-1.5 py-1 px-3"
            >
              <Link href={getInterviewLPLink(bill.id)}>
                <Image
                  src="/icons/interview-cooperation.svg"
                  alt=""
                  width={23}
                  height={23}
                />
                AIインタビューに協力する
              </Link>
            </Button>
          )}
          <BillDetailShareButton
            shareMessage={shareMessage}
            shareUrl={shareUrl}
            thumbnailUrl={thumbnailUrl}
          />
        </div>
      </div>
    </div>
  );
}
