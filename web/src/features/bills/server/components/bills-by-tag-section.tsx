import Link from "next/link";
import type { BillsByTag } from "../../shared/types";
import { BillCard } from "../../client/components/bill-list/bill-card";

interface BillsByTagSectionProps {
  billsByTag: BillsByTag[];
}

export function BillsByTagSection({ billsByTag }: BillsByTagSectionProps) {
  if (billsByTag.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12">
      {billsByTag.map(({ tag, bills }) => (
        <section key={tag.id} className="flex flex-col gap-6">
          {/* タグヘッダー */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[22px] font-bold text-black leading-[1.48]">
              {tag.label}
            </h2>
            {tag.description && (
              <p className="text-xs text-mirai-text-secondary">
                {tag.description}
              </p>
            )}
            {/*
              トップに出しているのは各タグの一部だけなので、残りを見に行ける
              入口を置く。検索ページは以前から ?tag= での絞り込みに対応している。
            */}
            <Link
              href={`/search?tag=${encodeURIComponent(tag.label)}`}
              className="w-fit text-xs font-medium text-primary-accent underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              「{tag.label}」の議案をすべて見る →
            </Link>
          </div>

          {/* 議案カード一覧 */}
          <div className="flex flex-col gap-4">
            {bills.map((bill) => (
              <Link key={bill.id} href={`/bills/${bill.id}`}>
                <BillCard bill={bill} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
