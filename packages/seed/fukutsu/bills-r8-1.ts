/**
 * 令和8年1月臨時会（第1回）の議案データ。
 *
 * 出どころ:
 * - 議決結果・委員長報告 … 会議録検索システムの会議録テキスト
 *   （fukutsu/build-bill-votes.ts で data/r8-1-bill-votes.json に書き出したもの）
 * - やさしいタイトルと要約 … 上記をもとにAIが平易に書き直し、ユーザー確認済み
 */
import { budgetSystemNote } from "./seed-bills-common";
import type { PlainText } from "./seed-bills-common";

export const R8_1_SESSION_SLUG = "r8-1";
export const R8_1_SOURCE_URL =
  "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/18960.html";

/** 1月臨時会は1日開催（令和8年1月13日）のため、議決日は常に同じ */
export function decidedAt(_sessionDay: number): string {
  return "2026-01-13";
}

export function submittedAt(_billNumber: string): string {
  return "2026-01-13";
}

export const PLAIN_TEXTS: Record<string, PlainText> = {
  議案第1号: {
    title: "今年度の市の予算を組み替える（一般会計補正予算）",
    summary: "令和7年度の一般会計予算を組み替える議案です。",
    systemNote: budgetSystemNote({
      kind: "補正予算",
      account: "市全体のお金（一般会計）",
    }),
    tag: "予算・財政",
    committee: "予算審査特別委員会",
  },
};
