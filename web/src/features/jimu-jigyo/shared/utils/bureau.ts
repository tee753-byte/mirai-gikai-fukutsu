// 親部局（フィルタ・表示順の集約単位）。DBの bureau_code と一致させる。

export const BUREAUS: { code: string; name: string }[] = [
  { code: "somu", name: "総務部" },
  { code: "kikaku", name: "企画・地域振興部" },
  { code: "hitozukuri", name: "人づくり・県民生活部" },
  { code: "hoken", name: "保健医療介護部" },
  { code: "fukushi", name: "福祉労働部" },
  { code: "kankyo", name: "環境部" },
  { code: "shoko", name: "商工部" },
  { code: "norin", name: "農林水産部" },
  { code: "kendo", name: "県土整備部" },
  { code: "kenchiku", name: "建築都市部" },
  { code: "kyoiku", name: "教育庁" },
  { code: "keisatsu", name: "警察本部" },
];

const NAME_BY_CODE = new Map(BUREAUS.map((b) => [b.code, b.name]));

/** 部局名（詳細名可）→ 親部局コード。未知は null */
export function bureauCodeFromName(
  name: string | null | undefined
): string | null {
  if (!name) return null;
  const hit = BUREAUS.find((b) => name.startsWith(b.name));
  return hit ? hit.code : null;
}

/** 親部局コード → 部局名 */
export function bureauName(code: string): string | undefined {
  return NAME_BY_CODE.get(code);
}
