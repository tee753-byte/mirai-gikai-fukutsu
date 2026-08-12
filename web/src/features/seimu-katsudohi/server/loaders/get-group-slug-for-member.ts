import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findGroupSlugForMember } from "../repositories/seimu-katsudohi-repository";

/**
 * ある議員が、指定した年度のどの報告書（自分自身 or 所属会派）に載っているかを取得
 * （10分キャッシュ）
 */
export async function getGroupSlugForMember(
  fiscalYearSlug: string,
  memberName: string
): Promise<{ groupSlug: string; groupName: string } | null> {
  return _getCached(fiscalYearSlug, memberName);
}

const _getCached = unstable_cache(
  async (fiscalYearSlug: string, memberName: string) =>
    findGroupSlugForMember(fiscalYearSlug, memberName),
  ["seimu-katsudohi-group-slug-for-member"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.SEIMU_KATSUDOHI],
  }
);
