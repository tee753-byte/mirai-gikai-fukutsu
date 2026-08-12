import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findFiscalYearsWithReports } from "../repositories/seimu-katsudohi-repository";

/**
 * 公開済みの政務活動費データが存在する年度一覧を取得（10分キャッシュ）
 */
export async function getFiscalYearsWithReports(): Promise<
  { slug: string; label: string }[]
> {
  return _getCached();
}

const _getCached = unstable_cache(
  async () => findFiscalYearsWithReports(),
  ["seimu-katsudohi-fiscal-years"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.SEIMU_KATSUDOHI],
  }
);
