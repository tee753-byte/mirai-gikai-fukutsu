/**
 * 議案番号（例:「議案第53号」「同意第14号」）の種別の並び。
 * 市の議決結果一覧とおおむね同じ順にして、公式資料と突き合わせやすくする。
 * ここに無い種別は最後にまとめる。
 */
const TYPE_ORDER = [
  "議案",
  "認定",
  "同意",
  "諮問",
  "報告",
  "発議",
  "請願",
  "陳情",
];

function parseBillNumber(billNumber: string): {
  typeRank: number;
  num: number;
} {
  const match = billNumber.match(/^(.+?)第\s*(\d+)\s*号/);
  if (!match) {
    return { typeRank: TYPE_ORDER.length, num: Number.POSITIVE_INFINITY };
  }
  const rank = TYPE_ORDER.indexOf(match[1]);
  return {
    typeRank: rank === -1 ? TYPE_ORDER.length : rank,
    num: Number(match[2]),
  };
}

/**
 * 種別 → 番号の機械的な順に並べ替える（元の配列は変えない）。
 *
 * 「全議案一覧」は番号で探す人が使うため、結果やタグの順ではなくこの順にする。
 * 以前は議決結果の順に並んでいて、同意第14号が第15号より後ろに来るなど
 * 探しにくかった（2026-11-15、外部レビューで指摘）。
 */
export function sortBillsByNumber<T extends { bill_number: string }>(
  bills: T[]
): T[] {
  return [...bills].sort((a, b) => {
    const pa = parseBillNumber(a.bill_number);
    const pb = parseBillNumber(b.bill_number);
    if (pa.typeRank !== pb.typeRank) return pa.typeRank - pb.typeRank;
    if (pa.num !== pb.num) return pa.num - pb.num;
    return a.bill_number.localeCompare(b.bill_number, "ja");
  });
}
