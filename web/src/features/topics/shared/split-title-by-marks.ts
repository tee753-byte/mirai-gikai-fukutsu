export type TitleSegment = { text: string; marked: boolean };

/**
 * 見出しを、マーカーを引く部分とそれ以外に分ける。
 * 見出しに無い語句は無視する（その分は引かれないだけ）。
 * 重なる指定があれば先に見つかった側を優先する。
 */
export function splitTitleByMarks(
  title: string,
  marks: string[] | undefined
): TitleSegment[] {
  if (!marks || marks.length === 0) return [{ text: title, marked: false }];

  const ranges: { start: number; end: number }[] = [];
  for (const mark of marks) {
    if (mark === "") continue;
    const start = title.indexOf(mark);
    if (start === -1) continue;
    ranges.push({ start, end: start + mark.length });
  }
  ranges.sort((a, b) => a.start - b.start);

  const segments: TitleSegment[] = [];
  let cursor = 0;
  for (const { start, end } of ranges) {
    if (start < cursor) continue;
    if (start > cursor) {
      segments.push({ text: title.slice(cursor, start), marked: false });
    }
    segments.push({ text: title.slice(start, end), marked: true });
    cursor = end;
  }
  if (cursor < title.length) {
    segments.push({ text: title.slice(cursor), marked: false });
  }
  return segments;
}
