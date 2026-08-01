import { unstable_cache } from "next/cache";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { findTagsByBillIds } from "../repositories/bill-repository";
import { findSearchableBills } from "../repositories/bill-search-repository";
import { attachVoteCounts } from "../repositories/bill-vote-repository";

export type BillSearchFilters = {
  /** 検索キーワード。空文字なら絞り込まない */
  keyword: string;
  /** 会期のslug。"" ならすべて */
  sessionSlug: string;
  /** bills.bill_type。"" ならすべて */
  billType: string;
  /** "passed"（可決・採択）／"failed"（否決・不採択）／"" ならすべて */
  result: string;
  /** タグのlabel。"" ならすべて */
  tag: string;
};

/** 検索対象。会期名も一緒に持たせて、会期での絞り込みと表示に使う */
export type SearchableBill = BillWithContent & {
  council_session?: { name: string; slug: string | null } | null;
};

export type BillSearchResult = {
  bills: SearchableBill[];
  /** 絞り込み前の総件数。「全◯件中◯件」の表示に使う */
  totalCount: number;
  /** 絞り込みに使える選択肢。掲載しているデータから作る */
  sessionOptions: { name: string; slug: string }[];
  tagOptions: string[];
};

/** 全角スペースでも区切れるようにする。複数語はAND条件 */
function toKeywords(keyword: string): string[] {
  return keyword
    .replace(/　/g, " ")
    .split(" ")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}

function matchesKeywords(
  bill: BillWithContent,
  sessionName: string,
  keywords: string[]
): boolean {
  if (keywords.length === 0) return true;

  // 正式名称・やさしい見出し・要約・議案番号・会期名のどこかに含まれていればヒット
  const haystack = [
    bill.name,
    bill.bill_content?.title,
    bill.bill_content?.summary,
    bill.bill_number,
    sessionName,
    ...(bill.tags?.map((t) => t.label) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return keywords.every((k) => haystack.includes(k));
}

function matchesResult(status: string, result: string): boolean {
  if (result === "") return true;
  if (result === "passed") {
    return status === "approved" || status === "adopted";
  }
  if (result === "failed") return status === "rejected";
  return true;
}

/**
 * 公開済みの議案・発議・請願をまとめて検索する。
 *
 * 掲載件数が数百件程度のうちは、全件を取得してからJavaScript側で絞り込む。
 * 議案名だけでなく要約やタグも対象にしたいため、この方が実装が素直で、
 * 表記ゆれにも強い。件数が増えて重くなったら全文検索インデックスに切り替える。
 */
export async function searchBills(
  filters: BillSearchFilters,
  difficultyLevel: DifficultyLevelEnum
): Promise<BillSearchResult> {
  const all = await _getCachedSearchableBills(difficultyLevel);
  const keywords = toKeywords(filters.keyword);

  const bills = all.filter((bill) => {
    const sessionName = bill.council_session?.name ?? "";
    if (
      filters.sessionSlug &&
      bill.council_session?.slug !== filters.sessionSlug
    ) {
      return false;
    }
    if (filters.billType && (bill.bill_type ?? "bill") !== filters.billType) {
      return false;
    }
    if (!matchesResult(bill.status, filters.result)) return false;
    if (filters.tag && !bill.tags?.some((t) => t.label === filters.tag)) {
      return false;
    }
    return matchesKeywords(bill, sessionName, keywords);
  });

  // 選択肢は掲載データから作る。中身の無い絞り込み条件を出さないため
  const sessionMap = new Map<string, string>();
  const tagSet = new Set<string>();
  for (const bill of all) {
    const s = bill.council_session;
    if (s?.slug) sessionMap.set(s.slug, s.name);
    for (const t of bill.tags ?? []) tagSet.add(t.label);
  }

  return {
    bills,
    totalCount: all.length,
    sessionOptions: [...sessionMap.entries()].map(([slug, name]) => ({
      slug,
      name,
    })),
    tagOptions: [...tagSet],
  };
}

const _getCachedSearchableBills = unstable_cache(
  async (difficultyLevel: DifficultyLevelEnum): Promise<SearchableBill[]> => {
    const data = await findSearchableBills(difficultyLevel);
    if (data.length === 0) return [];

    const billIds = data.map((item) => item.id);
    const tagsByBillId = await findTagsByBillIds(billIds);

    const billsWithContent = data.map((item) => {
      const { bill_contents, council_sessions, ...bill } = item;
      return {
        ...bill,
        bill_content: Array.isArray(bill_contents)
          ? bill_contents[0]
          : undefined,
        tags: tagsByBillId.get(item.id) ?? [],
        council_session: Array.isArray(council_sessions)
          ? council_sessions[0]
          : council_sessions,
      };
    }) as SearchableBill[];

    return (await attachVoteCounts(billsWithContent)) as SearchableBill[];
  },
  ["searchable-bills"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.BILLS],
  }
);
