import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  findDebatesByBillId,
  findMemberVotesByBillId,
  findSponsorsByBillId,
} from "../repositories/bill-vote-repository";

/**
 * 議案の「誰がどの立場だったか」をまとめて取る。
 * 出どころが違うので、討論・提出者・議員別賛否はそれぞれ別のまま返す。
 */
export const getBillVotes = unstable_cache(
  async (billId: string) => {
    const [debates, sponsors, memberVotes] = await Promise.all([
      findDebatesByBillId(billId),
      findSponsorsByBillId(billId),
      findMemberVotesByBillId(billId),
    ]);

    return { debates, sponsors, memberVotes };
  },
  ["bill-votes"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
