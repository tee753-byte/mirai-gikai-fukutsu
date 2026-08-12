import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SeimuKatsudohiReportWithItems } from "../../shared/types";
import { findPublishedReportsWithItemsByFiscalYear } from "../repositories/seimu-katsudohi-repository";

/**
 * 年度スラッグに紐づく公開済み報告書一覧を取得（内訳含む、10分キャッシュ）
 */
export async function getReportsByFiscalYear(
  fiscalYearSlug: string
): Promise<SeimuKatsudohiReportWithItems[]> {
  return _getCached(fiscalYearSlug);
}

const _getCached = unstable_cache(
  async (fiscalYearSlug: string) =>
    findPublishedReportsWithItemsByFiscalYear(fiscalYearSlug),
  ["seimu-katsudohi-reports-by-fiscal-year"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.SEIMU_KATSUDOHI],
  }
);
