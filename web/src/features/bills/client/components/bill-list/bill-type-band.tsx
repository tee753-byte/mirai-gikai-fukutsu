import { getBillTypeMeta } from "../../../shared/utils/bill-type";

interface BillTypeBandProps {
  billType: string | null | undefined;
  billNumber?: string | null;
}

/**
 * カードの上端いっぱいに引く、種別の色帯。
 *
 * 地色は淡く、文字は同系の濃い色にしている。サイト全体の色調に合わせるためと、
 * 濃い地色に白抜きだと一覧に並んだとき色の面積が大きくなりすぎるため。
 * 下線を1本入れて、白いカード本体との境目をはっきりさせている。
 */
export function BillTypeBand({ billType, billNumber }: BillTypeBandProps) {
  const meta = getBillTypeMeta(billType);

  return (
    <div
      className={`flex items-center justify-between gap-3 border-b px-4 py-1.5 ${meta.bgClass} ${meta.borderClass}`}
    >
      <span className={`text-xs font-bold ${meta.textClass}`}>
        {meta.label}
        <span className="sr-only">（{meta.description}）</span>
      </span>
      {billNumber && (
        <span className={`text-xs font-medium opacity-80 ${meta.textClass}`}>
          {billNumber}
        </span>
      )}
    </div>
  );
}
