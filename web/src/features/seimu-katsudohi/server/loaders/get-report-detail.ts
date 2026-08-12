import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SeimuKatsudohiReportWithItems } from "../../shared/types";
import { findPublishedReportBySlug } from "../repositories/seimu-katsudohi-repository";

/**
 * 年度スラッグ + group_slug で公開済み報告書を1件取得（内訳含む、10分キャッシュ）
 */
export async function getReportDetail(
  fiscalYearSlug: string,
  groupSlug: string
): Promise<SeimuKatsudohiReportWithItems | null> {
  return _getCached(fiscalYearSlug, groupSlug);
}

const _getCached = unstable_cache(
  async (fiscalYearSlug: string, groupSlug: string) =>
    findPublishedReportBySlug(fiscalYearSlug, groupSlug),
  ["seimu-katsudohi-report-detail"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.SEIMU_KATSUDOHI],
  }
);
