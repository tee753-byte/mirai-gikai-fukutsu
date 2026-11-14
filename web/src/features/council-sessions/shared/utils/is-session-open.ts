import type { CouncilSession } from "../types";

/**
 * 指定日時点で、会期がまだ閉会していない（予告の言い回しが使える）かどうか。
 *
 * 「本日は」バー等が使う会期の期間判定（start_date <= today <= end_date、
 * end_date を含む）とは違い、こちらは**閉会日当日を「開催済み」側に含める**。
 * 閉会日の本会は日中に終わるため、その日のうちに「予告」「これから決まります」
 * という言い回しのまま残ると事実と食い違う（2026-09-18、閉会当日にユーザーから
 * 指摘）。時刻までは持っていないため、閉会日を跨いだ瞬間の判定は割り切りになる。
 *
 * 開会前（today < start_date）も「閉会していない」側に含める。以前は開会日を
 * 条件に入れていたため、開会の1週間前に「開催済み」と表示された（2026-11-14）。
 */
export function isSessionOpen(session: CouncilSession, today: string): boolean {
  return session.end_date == null || session.end_date > today;
}
