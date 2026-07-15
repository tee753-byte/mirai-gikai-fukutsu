// 事業費（千円単位）を一覧カード等で読みやすい単位に丸めて表示する。
// 評価書の事業費は千円単位で、数千〜数百万千円（＝数十億円）まで幅があるため、
// 桁に応じて億円／万円／千円を使い分ける。

/**
 * 千円単位の金額を表示用文字列にする。
 * - 1億円以上（100,000千円〜）: 「69.3億円」
 * - 1万円以上（10千円〜）      : 「316万円」
 * - それ未満                   : 「5千円」
 */
export function formatBudget(senYen: number): string {
  if (senYen >= 100_000) return `${(senYen / 100_000).toFixed(1)}億円`;
  if (senYen >= 10) return `${Math.round(senYen / 10).toLocaleString()}万円`;
  return `${senYen.toLocaleString()}千円`;
}
