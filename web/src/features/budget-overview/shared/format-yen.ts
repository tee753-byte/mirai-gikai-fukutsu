/**
 * 千円単位の値を「○億円」「○万円」に直す。
 *
 * 予算資料は千円単位で書かれているが、そのまま出すと桁が読めない。
 * サーバー側の一覧とクライアント側のカードの両方で使うため共通に置く。
 */
export function formatYen(amount: number | null): string | null {
  if (amount === null) return null;
  const yen = amount * 1000;
  if (yen >= 100_000_000) {
    return `${(yen / 100_000_000).toFixed(1).replace(/\.0$/, "")}億円`;
  }
  if (yen >= 10_000) {
    return `${Math.round(yen / 10_000).toLocaleString()}万円`;
  }
  return `${yen.toLocaleString()}円`;
}
