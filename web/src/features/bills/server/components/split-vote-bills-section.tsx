import Link from "next/link";
import type { BillWithContent } from "../../shared/types";

/** 会期詳細ページの「賛否が分かれた案件」セクション。全会一致でない議案だけを、賛否の内訳バー付きで並べる */
export function SplitVoteBillsSection({ bills }: { bills: BillWithContent[] }) {
  if (bills.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[22px] font-bold text-black leading-[1.48]">
        🗳️ 賛否が分かれた案件
      </h2>
      <div className="flex flex-col gap-3">
        {bills.map((bill) => {
          const { for: forCount, against } = bill.voteCounts ?? {
            for: 0,
            against: 0,
          };
          const total = forCount + against;
          const forPct = total > 0 ? (forCount / total) * 100 : 0;

          return (
            <Link
              key={bill.id}
              href={`/bills/${bill.id}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors"
            >
              <p className="font-bold text-[15px] text-mirai-text line-clamp-2">
                {bill.bill_content?.title || bill.name}
              </p>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-mirai-surface-muted">
                <div
                  className="h-full bg-bill-approved-text"
                  style={{ width: `${forPct}%` }}
                />
                <div
                  className="h-full bg-bill-rejected-text"
                  style={{ width: `${100 - forPct}%` }}
                />
              </div>
              <p className="text-xs text-mirai-text-secondary">
                賛成{forCount}・反対{against}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
