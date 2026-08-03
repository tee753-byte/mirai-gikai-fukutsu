import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  type RelatedBill,
  toRelatedBills,
} from "../../shared/utils/related-bills";
import { findBillsWithSameName } from "../repositories/bill-repository";

export type { RelatedBill };

/**
 * 同じ件名で提出された、ほかの会期の議案を新しい順に返す。
 *
 * 会議録や市議会だよりの公開待ちで中身の薄い会期でも、過去に同じ議案が
 * 出ていれば、そちらのページで討論や議員別の賛否まで読める。
 * 同じ会期のなかに市長提出と議員提出の両方がある場合（令和7年12月定例会の
 * 議案第44号と発議第8号）も件名が同じなので、同じ仕組みで結び付く。
 */
export async function getRelatedBills(
  billId: string,
  billName: string
): Promise<RelatedBill[]> {
  return _getCachedRelatedBills(billId, billName);
}

const _getCachedRelatedBills = unstable_cache(
  async (billId: string, billName: string): Promise<RelatedBill[]> => {
    return toRelatedBills(await findBillsWithSameName(billName, billId));
  },
  ["related-bills-by-name"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS],
  }
);
