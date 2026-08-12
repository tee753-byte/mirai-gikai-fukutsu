import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  SeimuKatsudohiReport,
  SeimuKatsudohiReportWithItems,
} from "../../shared/types";

/**
 * 公開済みの政務活動費データが存在する年度スラッグを新しい順に取得
 */
export async function findFiscalYearsWithReports(): Promise<
  { slug: string; label: string }[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("seimu_katsudohi_reports")
    .select("fiscal_year_slug, fiscal_year_label")
    .eq("publish_status", "published");

  if (error) {
    console.error("Failed to fetch seimu-katsudohi fiscal years:", error);
    return [];
  }

  const seen = new Map<string, string>();
  for (const row of data ?? []) {
    if (!seen.has(row.fiscal_year_slug)) {
      seen.set(row.fiscal_year_slug, row.fiscal_year_label);
    }
  }

  return [...seen.entries()]
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => b.slug.localeCompare(a.slug));
}

/**
 * 年度スラッグに紐づく公開済み報告書一覧を取得
 */
export async function findPublishedReportsByFiscalYear(
  fiscalYearSlug: string
): Promise<SeimuKatsudohiReport[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("seimu_katsudohi_reports")
    .select("*")
    .eq("fiscal_year_slug", fiscalYearSlug)
    .eq("publish_status", "published");

  if (error) {
    throw new Error(
      `Failed to fetch seimu-katsudohi reports: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * 年度スラッグに紐づく公開済み報告書一覧を取得（内訳含む）。
 * 一覧画面のカード表示・費目別比較マトリクスの両方で使う。
 */
export async function findPublishedReportsWithItemsByFiscalYear(
  fiscalYearSlug: string
): Promise<SeimuKatsudohiReportWithItems[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("seimu_katsudohi_reports")
    .select(
      `
      *,
      seimu_katsudohi_expenditure_items (*)
    `
    )
    .eq("fiscal_year_slug", fiscalYearSlug)
    .eq("publish_status", "published")
    .order("sort_order", {
      referencedTable: "seimu_katsudohi_expenditure_items",
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Failed to fetch seimu-katsudohi reports with items: ${error.message}`
    );
  }

  return (data ?? []).map((row) => {
    const { seimu_katsudohi_expenditure_items, ...report } = row;
    return {
      ...report,
      items: seimu_katsudohi_expenditure_items ?? [],
    } as SeimuKatsudohiReportWithItems;
  });
}

/**
 * ある議員が、指定した年度のどの報告書（自分自身 or 所属会派）に載っているかを調べる。
 * 議員個人ページから政務活動費ページへのリンクに使う。
 */
export async function findGroupSlugForMember(
  fiscalYearSlug: string,
  memberName: string
): Promise<{ groupSlug: string; groupName: string } | null> {
  const supabase = createAdminClient();

  // 一般質問側の氏名は「山本 祐平」のようにスペースが入ることがある一方、
  // 政務活動費側は member-profiles.ts のslugと同じスペース無し表記で統一している。
  // findMemberProfile と同じ正規化をして突き合わせる。
  const normalizedName = memberName.replace(/[\s　]/g, "");

  const { data, error } = await supabase
    .from("seimu_katsudohi_reports")
    .select("group_slug, group_name")
    .eq("fiscal_year_slug", fiscalYearSlug)
    .eq("publish_status", "published")
    .contains("member_names", [normalizedName])
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch seimu-katsudohi group for member:", error);
    return null;
  }

  if (!data) return null;

  return { groupSlug: data.group_slug, groupName: data.group_name };
}

/**
 * 年度スラッグ + group_slug で公開済み報告書を1件取得（内訳含む）
 */
export async function findPublishedReportBySlug(
  fiscalYearSlug: string,
  groupSlug: string
): Promise<SeimuKatsudohiReportWithItems | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("seimu_katsudohi_reports")
    .select(
      `
      *,
      seimu_katsudohi_expenditure_items (*)
    `
    )
    .eq("fiscal_year_slug", fiscalYearSlug)
    .eq("group_slug", groupSlug)
    .eq("publish_status", "published")
    .order("sort_order", {
      referencedTable: "seimu_katsudohi_expenditure_items",
      ascending: true,
    })
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch seimu-katsudohi report detail: ${error.message}`
    );
  }

  if (!data) return null;

  const { seimu_katsudohi_expenditure_items, ...report } = data;

  return {
    ...report,
    items: seimu_katsudohi_expenditure_items ?? [],
  } as SeimuKatsudohiReportWithItems;
}
