"use client";

import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  EXPENDITURE_SOURCE_URL,
  EXPENDITURES_R8,
  FISCAL_YEAR_LABEL,
  GENERAL_ACCOUNT_PREV_TOTAL,
  GENERAL_ACCOUNT_TOTAL,
  PREV_FISCAL_YEAR_LABEL,
  withDiff,
} from "../../shared/expenditure-r8";

/** 千円単位の値を「○億円」「○万円」に直す。桁が大きいので億円を基本にする */
function formatSenYen(sen: number): string {
  const yen = Math.abs(sen) * 1000;
  const sign = sen < 0 ? "△" : "";
  if (yen >= 100_000_000) {
    return `${sign}${(yen / 100_000_000).toFixed(1).replace(/\.0$/, "")}億円`;
  }
  if (yen >= 10_000) {
    return `${sign}${Math.round(yen / 10_000).toLocaleString()}万円`;
  }
  return `${sign}${yen.toLocaleString()}円`;
}

function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  const sign = rate > 0 ? "+" : rate < 0 ? "△" : "±";
  return `${sign}${Math.abs(rate).toFixed(1)}%`;
}

type SortKey = "amount" | "diff";

export function ExpenditureComparison() {
  const [sortKey, setSortKey] = useState<SortKey>("amount");

  const items = withDiff(EXPENDITURES_R8);
  const maxAmount = Math.max(...items.map((i) => i.amount));
  // 増減バーは左右に伸ばすので、増・減それぞれの最大幅を絶対値でそろえる
  const maxAbsDiff = Math.max(...items.map((i) => Math.abs(i.diff)));

  const sorted = [...items].sort((a, b) =>
    sortKey === "amount" ? b.amount - a.amount : b.diff - a.diff
  );

  const totalDiff = GENERAL_ACCOUNT_TOTAL - GENERAL_ACCOUNT_PREV_TOTAL;
  const totalRate = (totalDiff / GENERAL_ACCOUNT_PREV_TOTAL) * 100;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-mirai-gradient px-4 py-4 sm:px-6">
        <h2 className="text-base font-bold text-mirai-text sm:text-lg">
          {FISCAL_YEAR_LABEL}の予算は何に使われるか
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-mirai-text-secondary">
          一般会計の歳出を分野ごとに分けたものです。前の年と比べてどこが増えたかも見られます。
        </p>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-2xl font-bold text-mirai-text">
            {formatSenYen(GENERAL_ACCOUNT_TOTAL)}
          </span>
          <span className="text-sm font-bold text-primary-accent">
            前年度より {formatSenYen(totalDiff)}（{formatRate(totalRate)}）
          </span>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div className="flex gap-2" role="group" aria-label="並べ替え">
          <SortButton
            active={sortKey === "amount"}
            onClick={() => setSortKey("amount")}
          >
            金額が大きい順
          </SortButton>
          <SortButton
            active={sortKey === "diff"}
            onClick={() => setSortKey("diff")}
          >
            増えた順
          </SortButton>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {sorted.map((item) => (
            <li key={item.no}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-mirai-text">
                  {item.name}
                </span>
                <span className="shrink-0 text-sm text-mirai-text-secondary tabular-nums">
                  {formatSenYen(item.amount)}
                </span>
              </div>

              {sortKey === "amount" ? (
                <AmountBar value={item.amount} max={maxAmount} />
              ) : (
                <DiffBar value={item.diff} max={maxAbsDiff} />
              )}

              <div className="mt-1 flex items-baseline justify-between gap-3">
                <span className="text-xs leading-relaxed text-mirai-text-muted">
                  {item.note}
                </span>
                <span
                  className={`shrink-0 text-xs font-bold tabular-nums ${
                    item.diff > 0
                      ? "text-primary-accent"
                      : item.diff < 0
                        ? "text-stance-against"
                        : "text-mirai-text-muted"
                  }`}
                >
                  {formatRate(item.rate)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-6">
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-mirai-text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            比べている{PREV_FISCAL_YEAR_LABEL}
            の金額は、当初予算ではなく「6月補正後予算」です。市の資料がその比較で作られているため、同じ条件で載せています。金額は千円単位の資料を億円・万円に直して表示しています。
          </span>
        </p>
        <Link
          href={EXPENDITURE_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-mirai-text-muted hover:text-mirai-text"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          出典：福津市「{FISCAL_YEAR_LABEL}市政運営の指針・予算の編成」
        </Link>
      </div>
    </section>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
        active
          ? "bg-primary text-white"
          : "bg-mirai-surface-grouped text-mirai-text-secondary hover:bg-mirai-surface-muted"
      }`}
    >
      {children}
    </button>
  );
}

/** 金額の棒。左端ぞろえ */
function AmountBar({ value, max }: { value: number; max: number }) {
  // 金額差が非常に大きい（民生費142億 対 労働費3千円）ため、
  // 極小の項目でも棒が見えるように最低幅を持たせる
  const width = Math.max((value / max) * 100, 0.5);
  return (
    <div className="mt-1 h-2 w-full rounded-full bg-mirai-surface-grouped">
      <div
        className="h-2 rounded-full bg-primary"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/** 増減の棒。中央から左（減）・右（増）に伸ばす */
function DiffBar({ value, max }: { value: number; max: number }) {
  const width = max === 0 ? 0 : (Math.abs(value) / max) * 50;
  const increased = value > 0;

  return (
    <div className="relative mt-1 h-2 w-full rounded-full bg-mirai-surface-grouped">
      {/* 中央の基準線 */}
      <div className="absolute left-1/2 top-0 h-2 w-px bg-mirai-border" />
      {value !== 0 && (
        <div
          className={`absolute top-0 h-2 ${
            increased
              ? "left-1/2 rounded-r-full bg-primary"
              : "rounded-l-full bg-stance-against"
          }`}
          style={
            increased
              ? { width: `${width}%` }
              : { width: `${width}%`, right: "50%" }
          }
        />
      )}
      <span className="sr-only">
        {increased ? "増加" : value < 0 ? "減少" : "増減なし"}
      </span>
    </div>
  );
}
