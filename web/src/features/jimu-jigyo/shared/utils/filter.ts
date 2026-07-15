import type { JimuJigyoRecord } from "../types/jimu-jigyo";
import { bureauCodeFromName } from "./bureau";
import { parseCategorySlug } from "./review-category";

// 一覧ページのフィルタ・集計（部局・見直し区分・キーワード）。
// すべて純粋関数。UIは searchParams から呼び出す。

export interface JimuJigyoFilter {
  bureau?: string; // 親部局コード
  category?: string; // 見直し区分slug（keizoku / keizoku-kakuju 等）
  q?: string; // キーワード
}

function normalizeQuery(s: string): string {
  return s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

function matchesBureau(record: JimuJigyoRecord, bureauCode: string): boolean {
  return bureauCodeFromName(record.部局) === bureauCode;
}

function matchesCategory(record: JimuJigyoRecord, slug: string): boolean {
  const parsed = parseCategorySlug(slug);
  if (!parsed) return true;
  if (record.見直し.大区分 !== parsed.major) return false;
  if (parsed.minor && record.見直し.小区分 !== parsed.minor) return false;
  return true;
}

function matchesQuery(record: JimuJigyoRecord, q: string): boolean {
  const needle = normalizeQuery(q);
  if (!needle) return true;
  const haystack = normalizeQuery(
    `${record.事業名}${record.課室 ?? ""}${record.部局}`
  );
  return haystack.includes(needle);
}

/** フィルタ条件をANDで適用 */
export function filterRecords(
  records: JimuJigyoRecord[],
  filter: JimuJigyoFilter
): JimuJigyoRecord[] {
  return records.filter((r) => {
    if (filter.bureau && !matchesBureau(r, filter.bureau)) return false;
    if (filter.category && !matchesCategory(r, filter.category)) return false;
    if (filter.q && !matchesQuery(r, filter.q)) return false;
    return true;
  });
}

/** 部局コード別の件数（全件ベース） */
export function countByBureau(
  records: JimuJigyoRecord[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of records) {
    const code = bureauCodeFromName(r.部局);
    if (code) out[code] = (out[code] ?? 0) + 1;
  }
  return out;
}

/** 見直し大区分・小区分別の件数（全件ベース） */
export function countByCategory(records: JimuJigyoRecord[]): {
  major: Record<string, number>;
  minor: Record<string, number>;
} {
  const major: Record<string, number> = {};
  const minor: Record<string, number> = {};
  for (const r of records) {
    const mj = r.見直し.大区分;
    const mn = r.見直し.小区分;
    if (mj) major[mj] = (major[mj] ?? 0) + 1;
    if (mj && mn) minor[`${mj}:${mn}`] = (minor[`${mj}:${mn}`] ?? 0) + 1;
  }
  return { major, minor };
}
