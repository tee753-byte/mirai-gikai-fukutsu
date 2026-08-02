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
  /**
   * やさしい版とくわしい版の両方の文章をつないだもの。検索だけに使う。
   * 委員会での質疑応答はくわしい版にしかないため、画面に出している版だけを
   * 探すと市民が目的の議案にたどり着けない。
   */
  searchText?: string;
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
  bill: SearchableBill,
  sessionName: string,
  keywords: string[]
): boolean {
  if (keywords.length === 0) return true;

  /*
   * 正式名称・議案番号・会期名・分野に加えて、やさしい版とくわしい版の
   * 両方の本文を対象にする。
   *
   * 本文には議案書に記載された理由や、委員会での質疑応答の引用が入っている。
   * 「福間南」のように、件名や要約には出てこないが審査の中では議論されている
   * 地名・施設名があり、本文を外すと市民が探せない。一般質問の検索が会議録の
   * 全文を対象にしているのと考え方をそろえる。
   */
  const haystack = [
    bill.name,
    bill.bill_number,
    sessionName,
    bill.searchText,
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
    const data = await findSearchableBills();
    if (data.length === 0) return [];

    const billIds = data.map((item) => item.id);
    const tagsByBillId = await findTagsByBillIds(billIds);

    const billsWithContent = data.map((item) => {
      const { bill_contents, council_sessions, ...bill } = item;
      const contents = Array.isArray(bill_contents)
        ? bill_contents
        : [bill_contents];

      return {
        ...bill,
        // 画面に出すのは読者が選んでいる難易度の文章だけ
        bill_content:
          contents.find((c) => c?.difficulty_level === difficultyLevel) ??
          contents[0] ??
          undefined,
        // 検索は両方の難易度の文章を対象にする
        searchText: contents
          .flatMap((c) => [c?.title, c?.summary, c?.content])
          .filter(Boolean)
          .join(" "),
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
