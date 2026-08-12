import type { SeimuKatsudohiReport } from "./types";

/**
 * 会派・無会派議員の一覧を「実績値で並べ替えない」既定の並び順にする。
 *
 * general-questions の group-questioners-by-party.ts と同じ考え方
 * （無所属を先頭固定→会派は人数の多い順→会派名50音順）を、政務活動費の
 * 報告書一覧に合わせて一般化したもの。支出額の大小では絶対に並べ替えない。
 */
export function sortReportsDefault<T extends SeimuKatsudohiReport>(
  reports: T[]
): T[] {
  const independents = reports
    .filter((r) => r.group_type === "independent_member")
    .sort((a, b) => a.group_name.localeCompare(b.group_name, "ja"));

  const caucuses = reports
    .filter((r) => r.group_type === "caucus")
    .sort((a, b) => {
      if (a.member_names.length !== b.member_names.length) {
        return b.member_names.length - a.member_names.length;
      }
      return a.group_name.localeCompare(b.group_name, "ja");
    });

  return [...independents, ...caucuses];
}
