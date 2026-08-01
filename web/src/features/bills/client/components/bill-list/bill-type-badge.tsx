import { getBillTypeMeta } from "../../../shared/utils/bill-type";

interface BillTypeBadgeProps {
  billType: string | null | undefined;
  className?: string;
}

/**
 * 議案・発議・請願を見分けるためのバッジ。
 * カード上端の色帯（BillTypeBand）を使わない場所で、種別を示したいときに使う。
 */
export function BillTypeBadge({ billType, className }: BillTypeBadgeProps) {
  const meta = getBillTypeMeta(billType);

  return (
    <span
      // 色だけに頼らないよう、色の意味はtitleとスクリーンリーダー向けテキストでも伝える
      title={meta.description}
      className={`inline-flex w-fit shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-bold ${meta.bgClass} ${meta.borderClass} ${meta.textClass} ${className ?? ""}`}
    >
      {meta.label}
      <span className="sr-only">（{meta.description}）</span>
    </span>
  );
}
