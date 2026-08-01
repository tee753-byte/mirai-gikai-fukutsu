import { unstable_cache } from "next/cache";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findAllSessionsWithBudget } from "../repositories/budget-repository";

/**
 * budget_overviews が存在する全会期を新しい順に取得
 */
export async function getSessionsWithBudget(): Promise<CouncilSession[]> {
  return _getCachedSessionsWithBudget();
}

const _getCachedSessionsWithBudget = unstable_cache(
  async (): Promise<CouncilSession[]> => {
    return findAllSessionsWithBudget();
  },
  ["sessions-with-budget"],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.COUNCIL_SESSIONS],
  }
);
