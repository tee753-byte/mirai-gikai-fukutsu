import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CouncilSession } from "../../shared/types";
import { findNextUpcomingCouncilSession } from "../repositories/council-session-repository";

/**
 * 指定日より後で最も近い、開会前の定例会を取得
 */
export async function getNextUpcomingCouncilSession(
  date: Date
): Promise<CouncilSession | null> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const targetDate = `${year}-${month}-${day}`;

  return _getCachedNextUpcomingCouncilSession(targetDate);
}

const _getCachedNextUpcomingCouncilSession = unstable_cache(
  async (targetDate: string): Promise<CouncilSession | null> => {
    return findNextUpcomingCouncilSession(targetDate);
  },
  ["next-upcoming-council-session"],
  {
    revalidate: 3600, // 1時間（3600秒）
    tags: [CACHE_TAGS.COUNCIL_SESSIONS],
  }
);
