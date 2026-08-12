/**
 * 政務活動費収支報告書の支出9費目。
 *
 * 福津市議会政務活動費の交付に関する条例にもとづく統一様式（別記様式）に
 * 定められた項目で、会派・無会派議員のどちらの報告書も同じ9項目・同じ並び順。
 * マイグレーションのcheck制約、シード、UIすべてがこの定数を参照する。
 */

export const EXPENDITURE_CATEGORIES = [
  { key: "research_training", label: "研究研修費" },
  { key: "research_travel", label: "調査旅費" },
  { key: "meeting", label: "会議費" },
  { key: "material_preparation", label: "資料作成費" },
  { key: "material_purchase", label: "資料購入費" },
  { key: "pr", label: "広報費" },
  { key: "office", label: "事務費" },
  { key: "personnel", label: "人件費" },
  { key: "other", label: "その他" },
] as const;

export type ExpenditureCategoryKey =
  (typeof EXPENDITURE_CATEGORIES)[number]["key"];

const LABEL_BY_KEY = new Map(
  EXPENDITURE_CATEGORIES.map((c) => [c.key, c.label])
);

export function getCategoryLabel(key: ExpenditureCategoryKey): string {
  return LABEL_BY_KEY.get(key) ?? key;
}
