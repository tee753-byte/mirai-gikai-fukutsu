import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CouncilSession } from "../../shared/types";
import {
  findAllCouncilSessionsWithBills,
  findSessionIdsWithMemberVotes,
} from "../repositories/council-session-repository";

/**
 * 公開済み議案がある定例会を全件取得（新しい順・開催中のものも含む）
 *
 * 会期一覧ページ専用。トップページの「過去の議会」は開催中の会期を別枠で出すため、
 * そちらは従来どおり getAllPastSessions を使う。
 */
export async function getAllSessionsWithBills(): Promise<CouncilSession[]> {
  return _getCachedAllSessionsWithBills();
}

/** 議員別の賛否が入っている会期のID。会期ごとの反映状況の表示に使う */
export async function getSessionIdsWithMemberVotes(): Promise<Set<string>> {
  return new Set(await _getCachedSessionIdsWithMemberVotes());
}

const _getCachedAllSessionsWithBills = unstable_cache(
  async (): Promise<CouncilSession[]> => {
    return findAllCouncilSessionsWithBills();
  },
  ["all-sessions-with-bills"],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.COUNCIL_SESSIONS],
  }
);

// unstable_cache は戻り値をJSON化して保存するため、Setのままだと復元できない。配列で持つ。
const _getCachedSessionIdsWithMemberVotes = unstable_cache(
  async (): Promise<string[]> => {
    return [...(await findSessionIdsWithMemberVotes())];
  },
  ["session-ids-with-member-votes"],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.COUNCIL_SESSIONS, CACHE_TAGS.BILLS],
  }
);
