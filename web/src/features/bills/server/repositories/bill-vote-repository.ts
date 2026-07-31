import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { BillWithContent } from "../../shared/types";
import { resolveQueryResult } from "../../shared/utils/resolve-query-result";

/**
 * 議案の賛否まわりのデータを取る。
 *
 * 福津市議会の採決はすべて起立採決で、会議録には「賛成多数であります」としか残らず、
 * どの議員が起立したかの氏名は記録されていない。そのため議員個人の立場は
 *   - 賛成討論・反対討論をした議員（bill_debates）… 会議録に氏名が残る確実な情報
 *   - 議会中継の録画を目視で確認した賛否（bill_member_votes）… 出典を明記して掲載
 * の2系統に分けて持っている。混ぜて表示しないこと。
 */

export async function findDebatesByBillId(billId: string) {
  const supabase = createAdminClient();
  const result = await supabase
    .from("bill_debates")
    .select("*")
    .eq("bill_id", billId)
    .order("speech_order", { ascending: true });

  return resolveQueryResult(result, "bill debates");
}

export async function findSponsorsByBillId(billId: string) {
  const supabase = createAdminClient();
  const result = await supabase
    .from("bill_sponsors")
    .select("*")
    .eq("bill_id", billId)
    .order("sort_order", { ascending: true });

  return resolveQueryResult(result, "bill sponsors");
}

export async function findMemberVotesByBillId(billId: string) {
  const supabase = createAdminClient();
  const result = await supabase
    .from("bill_member_votes")
    .select("*")
    .eq("bill_id", billId)
    .order("member_name", { ascending: true });

  return resolveQueryResult(result, "bill member votes");
}

/**
 * 複数議案分の賛成・反対の人数をまとめて取る（議案一覧カードのバッジ表示用）。
 * bill_member_votesが無い議案（ほとんどの議案。起立採決のため個人の賛否が
 * 会議録に残らない）はMapに含めず、カード側で数字なし表示にフォールバックする。
 */
export async function findVoteCountsByBillIds(
  billIds: string[]
): Promise<Map<string, { for: number; against: number }>> {
  if (billIds.length === 0) {
    return new Map();
  }

  const supabase = createAdminClient();
  const result = await supabase
    .from("bill_member_votes")
    .select("bill_id, vote")
    .in("bill_id", billIds)
    .in("vote", ["for", "against"]);

  const rows = resolveQueryResult(result, "bill vote counts");

  const counts = new Map<string, { for: number; against: number }>();
  for (const row of rows) {
    const current = counts.get(row.bill_id) ?? { for: 0, against: 0 };
    if (row.vote === "for") current.for += 1;
    if (row.vote === "against") current.against += 1;
    counts.set(row.bill_id, current);
  }

  return counts;
}

/**
 * 議案一覧に賛成・反対の人数を付与する。議案カードを組み立てるローダー
 * （get-bills / get-session-bills / get-featured-bills / get-previous-session-bills）
 * から共通で呼び、どの一覧でもバッジの有無が揃うようにする。
 */
export async function attachVoteCounts<T extends BillWithContent>(
  bills: T[]
): Promise<T[]> {
  if (bills.length === 0) {
    return bills;
  }

  const voteCountsByBillId = await findVoteCountsByBillIds(
    bills.map((b) => b.id)
  );

  return bills.map((bill) => ({
    ...bill,
    voteCounts: voteCountsByBillId.get(bill.id),
  }));
}
