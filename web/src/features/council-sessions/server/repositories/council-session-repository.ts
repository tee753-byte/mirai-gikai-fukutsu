import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { CouncilSession } from "../../shared/types";

/**
 * アクティブな定例会を取得
 */
export async function findActiveCouncilSession(): Promise<CouncilSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch active council session:", error);
    return null;
  }

  return data;
}

/**
 * 指定日時点で開催中の定例会を取得
 */
export async function findCurrentCouncilSession(
  targetDate: string
): Promise<CouncilSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .lte("start_date", targetDate)
    .or(`end_date.gte.${targetDate},end_date.is.null`)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch current council session:", error);
    return null;
  }

  return data;
}

/**
 * 指定日より後で最も近い、開会前の定例会を取得
 * 会期日程・一般質問通告書などは公開されるが、議案の掲載はまだ先という
 * 「開会前」の状態をトップページの「本日は」バーで案内するために使う
 */
export async function findNextUpcomingCouncilSession(
  afterDate: string
): Promise<CouncilSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .gt("start_date", afterDate)
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch next upcoming council session:", error);
    return null;
  }

  return data;
}

/**
 * 全定例会を新しい順に取得（アクティブなものを除く、公開済み議案が1件以上あるもののみ）
 */
export async function findAllPastCouncilSessions(): Promise<CouncilSession[]> {
  const supabase = createAdminClient();

  // bills テーブルから published な議案がある会期IDを取得
  const { data: billData, error: billError } = await supabase
    .from("bills")
    .select("council_session_id")
    .eq("publish_status", "published");

  if (billError) {
    console.error("Failed to fetch published bills:", billError);
    return [];
  }

  const sessionIds = [
    ...new Set(
      (billData ?? [])
        .map((b) => b.council_session_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  if (sessionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .eq("is_active", false)
    .in("id", sessionIds)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch past council sessions:", error);
    return [];
  }

  return (data ?? []) as CouncilSession[];
}

/**
 * 公開済み議案が1件以上ある定例会を新しい順に取得（開催中のものも含む）。
 *
 * findAllPastCouncilSessions と違い is_active で絞らない。会期一覧ページは
 * 「これまでの議会」をすべて並べるため、直近の会期も落とさずに出す。
 */
export async function findAllCouncilSessionsWithBills(): Promise<
  CouncilSession[]
> {
  const supabase = createAdminClient();

  const { data: billData, error: billError } = await supabase
    .from("bills")
    .select("council_session_id")
    .eq("publish_status", "published");

  if (billError) {
    console.error("Failed to fetch published bills:", billError);
    return [];
  }

  const sessionIds = [
    ...new Set(
      (billData ?? [])
        .map((b) => b.council_session_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  if (sessionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .in("id", sessionIds)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch council sessions:", error);
    return [];
  }

  return (data ?? []) as CouncilSession[];
}

/**
 * 議員別の賛否が入っている会期のIDを返す。
 *
 * 議員別の賛否は市議会だよりの賛否一覧表からしか取れず、だよりは定例会の
 * およそ2か月後に発行される。そのため直近の会期は必ず空になる。
 * 会期一覧では、この有無を「どこまで反映済みか」の目印に使う。
 */
export async function findSessionIdsWithMemberVotes(): Promise<Set<string>> {
  const supabase = createAdminClient();

  /*
   * 賛否は1議案あたり議員の人数ぶん（17件）できるため、会期が増えるほど行が増える。
   * PostgRESTは1回のリクエストで返す行数に上限（既定1000行）があり、まとめて
   * 取ると古い会期のぶんで打ち切られ、新しい会期が「賛否なし」に見えてしまう。
   * 会期の判定に必要なのは重複を除いたIDだけなので、上限ぶんずつ辿って集める。
   */
  const PAGE_SIZE = 1000;
  const sessionIds = new Set<string>();

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("bill_member_votes")
      .select("bills!inner(council_session_id)")
      .order("bill_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Failed to fetch sessions with member votes:", error);
      return new Set();
    }

    const rows = (data ?? []) as unknown as {
      bills: { council_session_id: string | null } | null;
    }[];

    for (const row of rows) {
      if (row.bills?.council_session_id) {
        sessionIds.add(row.bills.council_session_id);
      }
    }

    if (rows.length < PAGE_SIZE) break;
  }

  return sessionIds;
}

/**
 * 指定日より前の直近の定例会を取得
 */
export async function findPreviousCouncilSession(
  beforeStartDate: string
): Promise<CouncilSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .lt("start_date", beforeStartDate)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch previous council session:", error);
    return null;
  }

  return data;
}
