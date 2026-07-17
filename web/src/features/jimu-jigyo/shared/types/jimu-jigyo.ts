// 事務事業評価（福岡県）のドメイン型
// jimu_jigyo_evaluations.raw_data に格納される抽出済みJSONの形状に対応する。

export type ReiwaYear = `R${number}`;

export type ReviewMajor = "継続" | "終了";
export type ReviewMinor =
  | "拡充"
  | "改善"
  | "一部改善"
  | "縮小"
  | "完了"
  | "再構築"
  | "廃止";

/** 事業費の年度別エントリ（キー例: "R6決算" "R7当初" "R8当初"） */
export interface BudgetYearEntry {
  歳出?: number | null;
  一般財源?: number | null;
}

export interface PrefKpiItem {
  内容: string;
  目標?: Partial<Record<ReiwaYear, string | number | null>> | null;
  実績?: Partial<Record<ReiwaYear, string | number | null>> | null;
  参考?: Record<
    string,
    Partial<Record<ReiwaYear, string | number | null>>
  > | null;
  累計?: Record<string, string | number | null> | null;
}

export interface SogoKeikaku {
  柱: string | null;
  中項目: string | null;
  小項目: string | null;
  具体的な取組: string | null;
}

/** 概要一覧PDF由来の表示用テキスト（様式1号の事業概要はスキーム図で抽出不可のため補完） */
export interface GaiyouText {
  事業の内容: string | null;
  主な指標の状況: string | null;
  ねらい目的: string | null;
}

export interface JimuJigyoData {
  整理番号: number;
  事業名: string;
  部局: string;
  課室: string | null;
  事業開始年度?: string | null;
  総合計画位置づけ?: SogoKeikaku | null;
  ねらい目的?: string | null;
  成果指標: PrefKpiItem[];
  進捗状況テキスト?: string | null;
  成果指標設定根拠?: string | null;
  目標値設定根拠?: string | null;
  実績評価と要因?: string | null;
  目標見直し?: string | null;
  効率化工夫?: string | null;
  事業費?: {
    年度別: Record<string, BudgetYearEntry>;
    人件費?: Record<
      string,
      { 時間?: number | null; 千円?: number | null }
    > | null;
    過年度出典?: {
      マッチ方式: string;
      pdf: string;
      印字ページ: number | null;
    } | null;
  } | null;
  見直し: {
    大区分: ReviewMajor | null;
    小区分: ReviewMinor | null;
    理由: string | null;
    内容: string | null;
  };
  出典?: {
    pdf: string;
    印字ページ?: number | null;
    pdfページ?: number;
  };
  概要一覧?: GaiyouText | null;
}

/** 公共事業再評価（様式3号総括表） */
export interface SaiHyokaData {
  担当部課: string;
  事業名称: string;
  事業期間: string | null;
  市町村地区: string | null;
  目的概要: string | null;
  進捗率: number | string | null;
  事業費: {
    R7まで_千円: number | null;
    総事業費_千円: number | null;
  };
  再評価結果: string;
  理由: string | null;
}

// ─── 3軸方向分析 ─────────────────────────────────────────────

export type ChangeDirection = "up" | "down" | "flat" | "unknown";

export type KpiAnalysisResult = {
  direction: ChangeDirection;
  changeRate: number | null;
  achievementRate: number | null;
  text: string;
};

export type BudgetAnalysisResult = {
  /**
   * 当初予算ベースの前年比（R7当初 → R8当初）。
   * 県の評価書は「前年度決算・当年度当初・翌年度当初」しか載せないため、
   * 同一基準で比較できるのは当初予算どうしだけ。これを予算軸の主指標とする。
   */
  direction: ChangeDirection;
  changeRate: number | null;
  /**
   * 決算ベースの前年比（R5決算 → R6決算）。
   * 過年度の評価書と突合できた事業でのみ算出できる（R7時点で52/266件）。
   */
  settlementDirection: ChangeDirection;
  settlementChangeRate: number | null;
  text: string;
};

export type EfficiencyAnalysisResult = {
  direction: ChangeDirection;
  changeRate: number | null;
  text: string;
};

export type JimuJigyoAnalysis = {
  kpi: KpiAnalysisResult;
  budget: BudgetAnalysisResult;
  efficiency: EfficiencyAnalysisResult;
};

export type JimuJigyoRecord = JimuJigyoData & {
  id: string; // slug
  analysis: JimuJigyoAnalysis;
};

export type SaiHyokaRecord = SaiHyokaData & { id: string };
