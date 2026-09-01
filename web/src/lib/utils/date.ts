export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * 日付をドット区切り形式でフォーマット (例: 2025.10.1)
 * ゼロ埋めなし
 * @deprecated formatDateJST を使用してください
 */
export function formatDateWithDots(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}.${month}.${day}`;
}

/**
 * 日付を日本時間でスラッシュ区切り形式でフォーマット (例: 2026/02/12)
 * タイムゾーンを Asia/Tokyo に固定してゼロ埋めあり
 */
export function formatDateJST(dateString: string): string {
  const date = new Date(dateString);
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}/${month}/${day}`;
}

/**
 * 日本時間の現在時刻を返す
 */
export function getJapanTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
}

/**
 * getJapanTime() が返す Date を YYYY-MM-DD 形式にする（ゼロ埋めあり）
 * getJapanTime() は toLocaleString 経由のためタイムゾーン情報を持たず、
 * 呼び出し元の実行環境のローカル時刻として getFullYear 等を呼ぶ必要がある
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
