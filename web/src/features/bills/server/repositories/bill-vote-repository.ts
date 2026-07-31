import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
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
