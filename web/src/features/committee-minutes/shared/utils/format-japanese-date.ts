/**
 * "2026-04-28" → "2026年4月28日（火）"
 * 実行環境のタイムゾーンに依存しないよう、日付文字列を直接分解して扱う。
 */
export function formatJapaneseDate(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday =
    weekdays[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}
