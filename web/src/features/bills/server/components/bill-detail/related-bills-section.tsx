import { ChevronRight, History } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  getCardStatusLabel,
  getStatusVariant,
} from "../../../shared/utils/bill-status";
import type { RelatedBill } from "../../loaders/get-related-bills";

interface RelatedBillsSectionProps {
  relatedBills: RelatedBill[];
}

/**
 * 同じ件名で提出された、ほかの会期の議案への導線。
 *
 * 会議録や市議会だよりが公開されるまで数か月かかるため、直近の会期の
 * ページは中身が薄い。同じ議案が過去にも出ていれば、そちらでは討論や
 * 議員別の賛否まで読めるので、そこへ渡す。
 *
 * 議決結果を並べて出すのは、同じ議案が繰り返し出されていること自体が
 * 市民にとっての情報だから。どちらが正しいという書き方はしない。
 */
export function RelatedBillsSection({
  relatedBills,
}: RelatedBillsSectionProps) {
  if (relatedBills.length === 0) {
    return null;
  }

  return (
    <section className="bg-card rounded-xl p-6">
      <h2 className="text-lg font-bold text-mirai-text mb-2 flex items-center gap-2">
        <History className="w-5 h-5 text-primary" />
        同じ件名で提出された議案
      </h2>
      <p className="text-sm leading-relaxed text-mirai-text-secondary mb-5">
        この議案と同じ件名の議案が、ほかの会期にも提出されています。会議録が公開されている会期では、質疑・討論や議員ごとの賛否まで読めます。
      </p>

      <ul className="flex flex-col divide-y divide-mirai-border">
        {relatedBills.map((bill) => (
          <li key={bill.id}>
            <Link
              href={`/bills/${bill.id}`}
              className="group flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-bold text-mirai-text">{bill.sessionName}</p>
                {bill.billNumber && (
                  <p className="mt-0.5 text-xs text-mirai-text-muted">
                    {bill.billNumber}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={getStatusVariant(bill.status)}>
                  {getCardStatusLabel(bill.status)}
                </Badge>
                <ChevronRight className="h-5 w-5 text-mirai-text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
