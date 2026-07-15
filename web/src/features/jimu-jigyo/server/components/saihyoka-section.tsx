import "server-only";
import type { SaiHyokaRecord } from "../../shared/types/jimu-jigyo";

type Props = {
  records: SaiHyokaRecord[];
};

/** 公共事業再評価（総括表）。詳細ページは持たずカードに全情報を表示 */
export function SaiHyokaSection({ records }: Props) {
  if (records.length === 0) {
    return (
      <p className="text-center py-16 text-mirai-text-muted">
        公共事業再評価のデータがありません。
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {records.map((r) => (
        <div
          key={r.id}
          className="bg-card border border-mirai-border rounded-lg p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-mirai-text">{r.事業名称}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-review-kaizen-bg text-review-kaizen-text shrink-0">
              {r.再評価結果}
            </span>
          </div>
          <p className="text-xs text-mirai-text-muted">
            {r.担当部課}
            {r.事業期間 && ` · ${r.事業期間}`}
          </p>
          {r.市町村地区 && (
            <p className="text-xs text-mirai-text-secondary whitespace-pre-line">
              {r.市町村地区}
            </p>
          )}
          {r.目的概要 && (
            <p className="text-xs text-mirai-text-secondary line-clamp-4 whitespace-pre-line">
              {r.目的概要}
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mirai-text-secondary border-t border-mirai-border pt-2">
            {r.進捗率 != null && <span>進捗率 {r.進捗率}%</span>}
            {r.事業費.総事業費_千円 != null && (
              <span>
                総事業費 {r.事業費.総事業費_千円.toLocaleString()}千円
              </span>
            )}
          </div>
          {r.理由 && (
            <p className="text-xs text-mirai-text-muted whitespace-pre-line">
              {r.理由}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
