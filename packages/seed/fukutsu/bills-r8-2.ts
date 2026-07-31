/**
 * 令和8年2月臨時会（第2回）の議案データ。
 *
 * 出どころ:
 * - 議決結果・討論・委員長報告 … 会議録検索システムの会議録テキスト
 *   （fukutsu/build-bill-votes.ts で data/r8-2-bill-votes.json に書き出したもの）
 * - やさしいタイトルと要約 … 上記をもとにAIが平易に書き直し、ユーザー確認済み
 */
import type { PlainText } from "./seed-bills-common";

export const R8_2_SESSION_SLUG = "r8-2";
export const R8_2_SOURCE_URL =
  "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19232.html";

/** 2月臨時会は1日開催（令和8年2月20日）のため、議決日は常に同じ */
export function decidedAt(_sessionDay: number): string {
  return "2026-02-20";
}

export function submittedAt(_billNumber: string): string {
  return "2026-02-20";
}

export const PLAIN_TEXTS: Record<string, PlainText> = {
  議案第2号: {
    title: "一部事務組合を組織する自治体が減ることに伴う規約変更",
    summary:
      "福岡県市町村職員退職手当組合の構成団体（久留米市外三市町高等学校組合）が解散すること等に伴い、組合規約を変更する議案です。",
    tag: "議会・行政のしくみ",
    committee: null,
  },
  議案第3号: {
    title: "新設小学校の工事契約を変更する（盛り土工法の見直し）",
    summary:
      "新設小学校建設地の盛り土工事について、8月の大雨被害を受けて工法を変更する契約変更議案です。反対討論（安全性への懸念）と賛成討論（費用削減・開校スケジュール優先）がありました。",
    tag: "子育て・教育",
    committee: "建設環境委員会",
  },
};
