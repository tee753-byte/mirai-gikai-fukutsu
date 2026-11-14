import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CouncilSession } from "../../shared/types";
import { findLatestCouncilSession } from "../repositories/council-session-repository";

/**
 * 一番新しい定例会を1件取得（is_active・開催期間を問わない）
 * トップページの予告埋め込みの出し分けに使う
 */
export async function getLatestCouncilSession(): Promise<CouncilSession | null> {
  return _getCachedLatestCouncilSession();
}

const _getCachedLatestCouncilSession = unstable_cache(
  async (): Promise<CouncilSession | null> => {
    return findLatestCouncilSession();
  },
  ["latest-council-session"],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.COUNCIL_SESSIONS],
  }
);
