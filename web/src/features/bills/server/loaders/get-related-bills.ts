import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  findRelatedBillGroup,
  othersInGroup,
} from "../../shared/data/related-bill-groups";
import {
  type RelatedBill,
  toRelatedBills,
} from "../../shared/utils/related-bills";
import { findBillsByNumbers } from "../repositories/bill-repository";

export type { RelatedBill };

export type RelatedBillsResult = {
  /** 何がつながっているのかの説明。節の本文に出す */
  description: string;
  bills: RelatedBill[];
};

/**
 * この議案と関連づけられた、ほかの会期の議案を新しい順に返す。
 * 関連づけが無ければ null。
 *
 * 会議録は公開まで約3か月、市議会だよりは約2か月かかるため、直近の会期の
 * ページは本文が薄く、議員ごとの賛否も入っていない。同じ内容の議案が過去にも
 * 出ていれば、そちらでは討論も賛否も読めるので、そこへ渡す。
 *
 * どの議案どうしをつなぐかは shared/data/related-bill-groups.ts に手で書く。
 * 件名が同じでも改正の向きが逆という組み合わせが実在し、機械的には判定できない。
 */
export async function getRelatedBills(
  sessionSlug: string | null | undefined,
  billNumber: string | null | undefined
): Promise<RelatedBillsResult | null> {
  if (!sessionSlug || !billNumber) return null;

  const group = findRelatedBillGroup({ sessionSlug, billNumber });
  if (!group) return null;

  const others = othersInGroup(group, { sessionSlug, billNumber });
  if (others.length === 0) return null;

  const bills = await _getCachedRelatedBills(
    others.map((o) => o.billNumber),
    others
  );
  if (bills.length === 0) return null;

  return { description: group.description, bills };
}

const _getCachedRelatedBills = unstable_cache(
  async (
    billNumbers: string[],
    refs: { sessionSlug: string; billNumber: string }[]
  ): Promise<RelatedBill[]> => {
    return toRelatedBills(await findBillsByNumbers(billNumbers), refs);
  },
  ["related-bills"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS],
  }
);
