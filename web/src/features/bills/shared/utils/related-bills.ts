import type { RelatedBillRef } from "../data/related-bill-groups";
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

type SessionRow = {
  name: string;
  slug: string | null;
  end_date: string | null;
};

/** DBから返ってきた行。council_sessions は型上、配列になることがある */
type BillRow = {
  id: string;
  bill_number: string | null;
  status: string;
  council_sessions: SessionRow | SessionRow[] | null;
};

function toSession(row: BillRow): SessionRow | null {
  const session = Array.isArray(row.council_sessions)
    ? row.council_sessions[0]
    : row.council_sessions;
  return session ?? null;
}

/**
 * 議案番号で引いてきた行から、指定した会期・議案番号のものだけを選び、
 * 表示用に整えて新しい会期の順に並べる。
 *
 * 番号だけで引くと別の会期の同じ番号が混ざるため、会期のslugまで
 * 一致するものに絞る。会期に紐づいていない議案は、いつのものか示せないので
 * 落とす。
 */
export function toRelatedBills(
  rows: BillRow[],
  refs: RelatedBillRef[]
): RelatedBill[] {
  return rows
    .flatMap((row) => {
      const session = toSession(row);
      if (!session?.slug || !row.bill_number) return [];

      const wanted = refs.some(
        (ref) =>
          ref.sessionSlug === session.slug && ref.billNumber === row.bill_number
      );
      if (!wanted) return [];

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
