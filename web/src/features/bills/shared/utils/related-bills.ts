import type { BillStatusEnum } from "../types";

/** 関連議案の一覧に出す1件ぶん */
export type RelatedBill = {
  id: string;
  billNumber: string | null;
  status: BillStatusEnum;
  sessionName: string;
  /** 並べ替えに使う会期の終了日。無ければ null */
  sessionEndDate: string | null;
};

type SessionRow = { name: string; end_date: string | null };

/** DBから返ってきた行。council_sessions は型上、配列になることがある */
type BillRow = {
  id: string;
  bill_number: string | null;
  status: string;
  council_sessions: SessionRow | SessionRow[] | null;
};

/**
 * 同じ件名の議案の行を、表示用に整えて新しい会期の順に並べる。
 *
 * 会期に紐づいていない議案は落とす。いつ提出されたものかを示せないと、
 * 「同じ議案が繰り返し出されている」という情報が伝わらないため。
 */
export function toRelatedBills(rows: BillRow[]): RelatedBill[] {
  return rows
    .flatMap((row) => {
      const session = Array.isArray(row.council_sessions)
        ? row.council_sessions[0]
        : row.council_sessions;
      if (!session) return [];

      return [
        {
          id: row.id,
          billNumber: row.bill_number,
          status: row.status as BillStatusEnum,
          sessionName: session.name,
          sessionEndDate: session.end_date ?? null,
        },
      ];
    })
    .sort((a, b) =>
      // 終了日が無いものは最後に回す
      (b.sessionEndDate ?? "").localeCompare(a.sessionEndDate ?? "")
    );
}
