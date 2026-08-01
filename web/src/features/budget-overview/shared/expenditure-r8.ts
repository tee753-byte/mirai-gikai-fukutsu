/**
 * 令和8年度当初予算（一般会計）の歳出内訳と前年比。プロトタイプ。
 *
 * 出どころ: 福津市「令和8年度 市政運営の指針・予算の編成」の「２ 予算の概要」。
 * https://www.city.fukutsu.lg.jp/soshiki/zaisei/zaisei/1/1/19279.html
 *
 * 【比較の前提】前年度の欄は「令和7年度 当初予算」ではなく
 * 「令和7年度 6月補正後予算」。資料自体がその比較で作られているため、
 * 数字を独自に組み替えず、資料どおりの比較を載せる。画面にもこの注記を出す。
 *
 * 【単位】千円。資料の表記をそのまま持っている。
 *
 * 数字は市の資料からの転記で、AIによる推計や加工は行っていない。
 */

export type ExpenditureItem = {
  /** 款の番号（資料の並び順） */
  no: number;
  /** 款の名前 */
  name: string;
  /** 令和8年度当初予算（千円） */
  amount: number;
  /** 令和7年度6月補正後予算（千円） */
  prevAmount: number;
  /** 市民向けの一言説明。款の名前だけでは何の費用か分からないため */
  note: string;
};

/** 一般会計の総額（千円） */
export const GENERAL_ACCOUNT_TOTAL = 33_625_791;
export const GENERAL_ACCOUNT_PREV_TOTAL = 30_232_167;

/** 5会計を合わせた総額（千円）。一般会計・特別会計・企業会計の合計 */
export const ALL_ACCOUNTS_TOTAL = 50_970_729;

export const FISCAL_YEAR_LABEL = "令和8年度";
export const PREV_FISCAL_YEAR_LABEL = "令和7年度";

export const EXPENDITURE_SOURCE_URL =
  "https://www.city.fukutsu.lg.jp/soshiki/zaisei/zaisei/1/1/19279.html";

export const EXPENDITURES_R8: ExpenditureItem[] = [
  {
    no: 1,
    name: "議会費",
    amount: 209_317,
    prevAmount: 218_007,
    note: "市議会の運営にかかる費用",
  },
  {
    no: 2,
    name: "総務費",
    amount: 3_672_472,
    prevAmount: 3_413_935,
    note: "庁舎の管理、住民票などの窓口、防犯・地域づくりなど",
  },
  {
    no: 3,
    name: "民生費",
    amount: 14_280_578,
    prevAmount: 13_754_589,
    note: "子育て支援、高齢者・障がい者福祉、生活保護など",
  },
  {
    no: 4,
    name: "衛生費",
    amount: 2_284_968,
    prevAmount: 2_364_335,
    note: "健康診断・予防接種、ごみ処理、環境対策など",
  },
  {
    no: 5,
    name: "労働費",
    amount: 3,
    prevAmount: 3,
    note: "働く人への支援。金額はごくわずか",
  },
  {
    no: 6,
    name: "農林水産業費",
    amount: 450_875,
    prevAmount: 472_917,
    note: "農業・漁業への支援、農地や漁港の整備など",
  },
  {
    no: 7,
    name: "商工費",
    amount: 189_287,
    prevAmount: 205_116,
    note: "商工業の振興、観光の推進など",
  },
  {
    no: 8,
    name: "土木費",
    amount: 1_712_470,
    prevAmount: 1_463_460,
    note: "道路・公園・住宅・下水道など、まちの整備",
  },
  {
    no: 9,
    name: "消防費",
    amount: 974_837,
    prevAmount: 921_457,
    note: "消防・救急、防災対策など",
  },
  {
    no: 10,
    name: "教育費",
    amount: 7_479_925,
    prevAmount: 5_455_928,
    note: "小中学校、公民館、図書館、文化・スポーツなど",
  },
  {
    no: 11,
    name: "災害復旧費",
    amount: 423_410,
    prevAmount: 5_617,
    note: "災害で壊れた道路・農地などを直す費用",
  },
  {
    no: 12,
    name: "公債費",
    amount: 1_912_528,
    prevAmount: 1_921_549,
    note: "これまでに借りたお金（市債）の返済",
  },
  {
    no: 13,
    name: "諸支出金",
    amount: 2,
    prevAmount: 2,
    note: "他のどれにも当てはまらない支出。金額はごくわずか",
  },
  {
    no: 14,
    name: "予備費",
    amount: 35_119,
    prevAmount: 35_252,
    note: "急な出費に備えて残しておく分",
  },
];

export type ExpenditureWithDiff = ExpenditureItem & {
  /** 増減額（千円）。マイナスは減 */
  diff: number;
  /** 伸び率（%）。前年が0のときは null */
  rate: number | null;
};

export function withDiff(items: ExpenditureItem[]): ExpenditureWithDiff[] {
  return items.map((item) => {
    const diff = item.amount - item.prevAmount;
    return {
      ...item,
      diff,
      rate: item.prevAmount === 0 ? null : (diff / item.prevAmount) * 100,
    };
  });
}
