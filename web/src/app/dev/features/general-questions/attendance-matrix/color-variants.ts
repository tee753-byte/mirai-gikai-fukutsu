import type { CellStyleMap } from "@/features/general-questions/server/components/attendance-matrix-table";
import { DEFAULT_CELL_STYLE } from "@/features/general-questions/server/components/attendance-matrix-table";

/**
 * 配色パターンの比較用（開発用ページ専用）。
 *
 * C（登壇の有無を最優先版）を本採用にしたため、DEFAULT_CELL_STYLE は
 * 現在Cと同じ内容になっている。ここではボツにした案も含めて並べ、
 * なぜCになったかを後から追える形にしている。
 * 「登壇なし」「議長のため行わない」の文字色は、実測でWCAGの基準未満
 * だったため、どのパターンも共通で修正後の色を使う（DEFAULT_CELL_STYLE参照）。
 */

/** A（不採用）: 現状路線＋コントラスト修正のみ。塗りの濃さで一般質問／総括質疑を分ける、これまでの見た目に一番近い案 */
export const VARIANT_A_CURRENT: CellStyleMap = {
  ...DEFAULT_CELL_STYLE,
  sokatsu: {
    mark: "◆",
    label: "総括質疑",
    className: "bg-primary/35 font-bold text-[#501111]",
  },
};

/** B（不採用）: 塗り／線 二層版。一般質問と総括質疑が別カテゴリに見えてしまい、意図（登壇したことをまとめて示す）と反するため見送り */
export const VARIANT_B_FILL_OUTLINE: CellStyleMap = {
  ...DEFAULT_CELL_STYLE,
  sokatsu: {
    mark: "◆",
    label: "総括質疑",
    className: "border-2 border-primary bg-card font-bold text-primary",
  },
};

/** C（採用）: 登壇の有無を最優先版。一般質問・総括質疑をどちらも赤系の塗りにまとめ、「登壇したか」がまず目に入るようにする。内訳はマークの形と凡例で区別する */
export const VARIANT_C_PRESENCE_FIRST: CellStyleMap = DEFAULT_CELL_STYLE;

/**
 * D（不採用）: チェックマーク版（えんじ色のまま）。
 *
 * 「登壇した＝チェック」と一目で分かる形を、色を増やさずマークの形だけで
 * 試した案。色相はサイトのアクセントカラー（臙脂）のまま変えていない。
 */
export const VARIANT_D_CHECK_MAROON: CellStyleMap = {
  ...VARIANT_C_PRESENCE_FIRST,
  general: {
    mark: "✓",
    label: "一般質問",
    className: "bg-primary font-bold text-white",
  },
  sokatsu: {
    mark: "✓",
    label: "総括質疑",
    className: "bg-primary/70 font-bold text-white",
  },
};

/**
 * E（不採用・検討用）: チェックマーク版（緑）。
 *
 * 「登壇した＝緑のチェック」という、チェックリストで見慣れた配色を
 * 試すための案。ただし緑のチェックは「合格・できている」という意味を
 * 強く連想させ、この表のすぐ下にある「回数の多い少ないだけで活動の
 * 量や質を判断できるものではない」という注記と矛盾して見えるため、
 * 最初から採用は前提にせず、その見え方を確認する目的だけで作った。
 */
export const VARIANT_E_CHECK_GREEN: CellStyleMap = {
  ...VARIANT_C_PRESENCE_FIRST,
  general: {
    mark: "✓",
    label: "一般質問",
    className: "bg-[#15803d] font-bold text-white",
  },
  sokatsu: {
    mark: "✓",
    label: "総括質疑",
    className: "bg-[#15803d]/70 font-bold text-white",
  },
};

export const COLOR_VARIANTS = [
  {
    key: "A",
    title: "A：現状路線＋コントラスト修正（不採用）",
    style: VARIANT_A_CURRENT,
  },
  {
    key: "B",
    title: "B：塗り／線 二層版（不採用）",
    style: VARIANT_B_FILL_OUTLINE,
  },
  {
    key: "C",
    title: "C：登壇の有無を最優先版（採用）",
    style: VARIANT_C_PRESENCE_FIRST,
  },
  {
    key: "D",
    title: "D：チェックマーク版・えんじ色のまま（不採用）",
    style: VARIANT_D_CHECK_MAROON,
  },
  {
    key: "E",
    title: "E：チェックマーク版・緑（不採用・検討用）",
    style: VARIANT_E_CHECK_GREEN,
  },
] as const;
