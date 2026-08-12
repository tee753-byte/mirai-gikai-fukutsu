/**
 * 円単位の値を「○万円」「○円」に直す。
 *
 * budget-overview の formatYen は資料が千円単位のためその前提で書かれているが、
 * 政務活動費の収支報告書はもともと円単位の資料のため、そのまま使えない。
 */
export function formatYen(amount: number): string {
  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString()}万円`;
  }
  return `${amount.toLocaleString()}円`;
}
