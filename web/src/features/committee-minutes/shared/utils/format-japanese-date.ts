/** "2026-04-28" → "2026年4月28日（火）" */
export function formatJapaneseDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
}
