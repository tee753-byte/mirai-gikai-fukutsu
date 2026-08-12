import type { Database } from "@mirai-gikai/supabase";

type ExpenditureCategoryKey =
  Database["public"]["Tables"]["seimu_katsudohi_expenditure_items"]["Row"]["category"];

/**
 * 令和7年度 政務活動費収支報告書のデータ。
 *
 * 出典: 福津市議会「政務活動費の公開」ページ
 *   https://www.city.fukutsu.lg.jp/gikai/koho/2369.html
 * 各会派・議員のPDF（同ページから、令和7年度収支報告書としてリンクされているもの）を
 * 1件ずつ画像として読み取り、手書きの金額・備考を転記した。
 *
 * 【転記方針】
 * - 空欄の項目は0円として転記した。
 * - 備考欄の手書きメモはそのまま転記した（表記ゆれもそのまま）。
 * - 「2 支出」の内訳9項目の合計が、原本の手書き合計（「計」の欄）と一致することを
 *   1件ずつ確認済み（下記コメントに検算を記載）。expenditureTotal・balanceは
 *   コード側で機械計算するため、このファイルには内訳の金額だけを持たせる。
 * - 会派の所属議員は `web/src/features/council-members/shared/member-profiles.ts` の
 *   `caucus` と突き合わせ、人数×240,000円が「1 収入」の金額と一致することを確認済み。
 */

export const SEIMU_KATSUDOHI_R7_SOURCE_PAGE_URL =
  "https://www.city.fukutsu.lg.jp/gikai/koho/2369.html";

type SeedExpenditureItem = {
  category: ExpenditureCategoryKey;
  amount: number;
  note: string | null;
};

type SeedReport = {
  groupType: "caucus" | "independent_member";
  groupName: string;
  groupSlug: string;
  memberNames: string[];
  incomeAmount: number;
  /** 収支報告書PDF自体へのリンク（一覧ページと同じディレクトリ配下） */
  sourceUrl: string;
  /** 空欄（0円）の項目も含め、原本の表の並び順どおりにすべて書く */
  items: SeedExpenditureItem[];
};

const PDF_BASE_URL = "https://www.city.fukutsu.lg.jp/material/files/group/20";

/** 空欄の項目を機械的に埋めるためのヘルパー。0円のときはnoteもnullにする */
function item(
  category: ExpenditureCategoryKey,
  amount: number,
  note: string | null = null
): SeedExpenditureItem {
  return { category, amount, note: amount === 0 ? null : note };
}

export const SEIMU_KATSUDOHI_R7_REPORTS: SeedReport[] = [
  {
    // 収入 480,000円 = 2名（石田まなみ・豆田優子）× 240,000円
    // 支出内訳の合計 476,162円は原本の手書き合計と一致。残額 3,838円
    groupType: "caucus",
    groupName: "ミモザの会",
    groupSlug: "ミモザの会",
    memberNames: ["石田まなみ", "豆田優子"],
    incomeAmount: 480_000,
    sourceUrl: `${PDF_BASE_URL}/mimozanokai07.pdf`,
    items: [
      item("research_training", 231_685, "議員研修"),
      item("research_travel", 81_866, "先進地視察"),
      item("meeting", 0),
      item("material_preparation", 0),
      item("material_purchase", 34_511, "書籍、資料購入費"),
      item("pr", 71_634, "議会報告ニュース"),
      item("office", 56_466, "インク代、タブレット負担金"),
      item("personnel", 0),
      item("other", 0),
    ],
  },
  {
    // 収入 480,000円 = 2名（井手口忠信・中村晶代）× 240,000円
    // 支出内訳の合計 282,735円は原本の手書き合計と一致。残額 197,265円
    groupType: "caucus",
    groupName: "公明党",
    groupSlug: "公明党",
    memberNames: ["井手口忠信", "中村晶代"],
    incomeAmount: 480_000,
    sourceUrl: `${PDF_BASE_URL}/koumeitou07.pdf`,
    items: [
      item("research_training", 193_000, "全国市町村議会議員研修他"),
      item("research_travel", 0),
      item("meeting", 0),
      item("material_preparation", 0),
      item("material_purchase", 50_215, "i-JAMP（時事通信社）"),
      item("pr", 3_520, "議会報告会場費"),
      item("office", 36_000, "議会タブレット負担金"),
      item("personnel", 0),
      item("other", 0),
    ],
  },
  {
    // 収入 480,000円 = 2名（岩下豊・戸田進一）× 240,000円
    // 支出内訳の合計 407,362円（原本に手書き合計欄なし、印字の残額72,638円と逆算一致）
    groupType: "caucus",
    groupName: "日本共産党",
    groupSlug: "日本共産党",
    memberNames: ["岩下豊", "戸田進一"],
    incomeAmount: 480_000,
    sourceUrl: `${PDF_BASE_URL}/nihonkyousantou07.pdf`,
    items: [
      item("research_training", 0),
      item("research_travel", 0),
      item("meeting", 0),
      item("material_preparation", 0),
      item("material_purchase", 57_920, "定期購読紙代"),
      item("pr", 313_442, "議会ニュース発行費"),
      item("office", 36_000, "議会タブレット端末議員負担金"),
      item("personnel", 0),
      item("other", 0),
    ],
  },
  {
    // 収入 720,000円 = 3名（大山隆之・尾島武弘・米山信）× 240,000円
    // 支出内訳の合計 187,105円は原本の手書き合計と一致。残額 532,895円
    groupType: "caucus",
    groupName: "新政会",
    groupSlug: "新政会",
    memberNames: ["大山隆之", "尾島武弘", "米山信"],
    incomeAmount: 720_000,
    sourceUrl: `${PDF_BASE_URL}/sinseikai07.pdf`,
    items: [
      item("research_training", 0),
      item("research_travel", 101_868, "視察"),
      item("meeting", 880, "会議室借り上げ"),
      item("material_preparation", 0),
      item("material_purchase", 4_320, "解放新聞"),
      item("pr", 0),
      item("office", 80_037, "議会タブレット型端末負担金ほか"),
      item("personnel", 0),
      item("other", 0),
    ],
  },
  {
    // 収入 720,000円 = 3名（倉元敏徳・秦浩・髙山賢二）× 240,000円
    // 支出内訳の合計 271,788円は原本の手書き合計と一致。残額 448,212円
    groupType: "caucus",
    groupName: "福津誠和会",
    groupSlug: "福津誠和会",
    memberNames: ["倉元敏徳", "秦浩", "髙山賢二"],
    incomeAmount: 720_000,
    sourceUrl: `${PDF_BASE_URL}/fukutuseiwakai07.pdf`,
    items: [
      item("research_training", 217_788, "視察研修費"),
      item("research_travel", 0),
      item("meeting", 0),
      item("material_preparation", 0),
      item("material_purchase", 0),
      item("pr", 0),
      item("office", 54_000, "タブレット負担金"),
      item("personnel", 0),
      item("other", 0),
    ],
  },
  {
    // 収入 480,000円 = 2名（佐伯美保・榎本博）× 240,000円
    // 支出内訳の合計 218,785円は原本の手書き合計と一致。残額 261,215円
    groupType: "caucus",
    groupName: "みんなの声によるみんなの会",
    groupSlug: "みんなの声によるみんなの会",
    memberNames: ["佐伯美保", "榎本博"],
    incomeAmount: 480_000,
    sourceUrl: `${PDF_BASE_URL}/minmin07.pdf`,
    items: [
      item("research_training", 2_152, "会費"),
      item("research_travel", 0),
      item("meeting", 0),
      item("material_preparation", 0),
      item("material_purchase", 180_633, "書籍"),
      item("pr", 0),
      item("office", 36_000, "タブレット端末負担金"),
      item("personnel", 0),
      item("other", 0),
    ],
  },
  {
    // 収入 240,000円（無会派）。支出内訳の合計 91,810円は原本の手書き合計と一致。残額 148,190円
    groupType: "independent_member",
    groupName: "山本祐平",
    groupSlug: "山本祐平",
    memberNames: ["山本祐平"],
    incomeAmount: 240_000,
    sourceUrl: `${PDF_BASE_URL}/yamamotoyuheigiin07.pdf`,
    items: [
      item("research_training", 0),
      item("research_travel", 0),
      item("meeting", 0),
      item("material_preparation", 0),
      item("material_purchase", 73_810, "書籍代"),
      item("pr", 0),
      item("office", 18_000, "タブレット負担金"),
      item("personnel", 0),
      item("other", 0),
    ],
  },
  {
    // 収入 240,000円（無会派）。支出内訳の合計 240,000円は原本の手書き合計と一致。残額 0円
    groupType: "independent_member",
    groupName: "中村恵輔",
    groupSlug: "中村恵輔",
    memberNames: ["中村恵輔"],
    incomeAmount: 240_000,
    sourceUrl: `${PDF_BASE_URL}/nakamurakeisukegiin07.pdf`,
    items: [
      item("research_training", 179_060, "旅費等"),
      item("research_travel", 48_433, "旅費等"),
      item("meeting", 0),
      item("material_preparation", 0),
      item("material_purchase", 0),
      item("pr", 0),
      item("office", 12_507, "タブレット端末負担金"),
      item("personnel", 0),
      item("other", 0),
    ],
  },
  {
    // 収入 240,000円（無会派）。支出内訳の合計 185,407円は原本の手書き合計と一致。残額 54,593円
    groupType: "independent_member",
    groupName: "中村清隆",
    groupSlug: "中村清隆",
    memberNames: ["中村清隆"],
    incomeAmount: 240_000,
    sourceUrl: `${PDF_BASE_URL}/nakamurakiyotakagiin07.pdf`,
    items: [
      item("research_training", 75_500, "旅費等"),
      item("research_travel", 0),
      item("meeting", 0),
      item("material_preparation", 0),
      item("material_purchase", 23_980, "書籍購入等"),
      item("pr", 0),
      item("office", 85_927, "文具・タブレット負担金等"),
      item("personnel", 0),
      item("other", 0),
    ],
  },
];
