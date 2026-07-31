import { unstable_cache } from "next/cache";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import {
  findPublishedBillsByDietSession,
  findTagsByBillIds,
} from "../repositories/bill-repository";
import { attachVoteCounts } from "../repositories/bill-vote-repository";

/**
 * 会期IDに紐づく公開済み議案を BillWithContent の配列で取得
 */
export async function getSessionBills(
  councilSessionId: string,
  difficultyLevel: DifficultyLevelEnum
): Promise<BillWithContent[]> {
  return _getCachedSessionBills(councilSessionId, difficultyLevel);
}

const _getCachedSessionBills = unstable_cache(
  async (
    councilSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent[]> => {
    const data = await findPublishedBillsByDietSession(
      councilSessionId,
      difficultyLevel
    );

    if (data.length === 0) {
      return [];
    }

    const billIds = data.map((item) => item.id);
    const tagsByBillId = await findTagsByBillIds(billIds);

    const billsWithContent: BillWithContent[] = data.map((item) => {
      const { bill_contents, ...bill } = item;
      return {
        ...bill,
        bill_content: Array.isArray(bill_contents)
          ? bill_contents[0]
          : undefined,
        tags: tagsByBillId.get(item.id) ?? [],
      };
    });

    return attachVoteCounts(billsWithContent);
  },
  ["session-bills"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.BILLS],
  }
);
