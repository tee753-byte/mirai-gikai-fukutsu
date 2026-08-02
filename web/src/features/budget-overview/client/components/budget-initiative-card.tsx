"use client";

import { useState } from "react";
import type { BudgetInitiative } from "../../shared/types";
import { BasicPlanThemeTag } from "./basic-plan-theme-tag";
import { BudgetInitiativeBadge } from "./budget-initiative-badge";

type BudgetInitiativeCardProps = {
  initiative: BudgetInitiative;
  /** 同じグループ内で一番大きい事業費（千円）。棒の長さの基準にする */
  maxAmount: number;
};

/** 千円単位の値を「○億円」「○万円」に直す */
export function formatYen(amount: number | null): string | null {
  if (amount === null) return null;
  const yen = amount * 1000;
  if (yen >= 100_000_000) {
    return `${(yen / 100_000_000).toFixed(1).replace(/\.0$/, "")}億円`;
  }
  if (yen >= 10_000) {
    return `${Math.round(yen / 10_000).toLocaleString()}万円`;
  }
  return `${yen.toLocaleString()}円`;
}

/** 前年度と比べた増減の一文。金額だけでは変化が分からないため添える */
function diffLabel(amount: number | null, prev: number | null): string | null {
  if (amount === null || prev === null) return null;
  if (prev === 0) return "前年度は予算なし";

  const diff = amount - prev;
  const rate = (diff / prev) * 100;
  if (Math.abs(rate) < 0.5) return "前年度とほぼ同額";

  const sign = diff > 0 ? "+" : "△";
  const abs = formatYen(Math.abs(diff));
  return `前年度より ${sign}${abs}（${sign}${Math.abs(rate).toFixed(0)}%）`;
}

/** 説明文が長い事業は、初期状態では3行に折りたたんでおく */
function InitiativeDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 60;

  return (
    <div className="mt-3">
      <p
        className={`text-sm leading-relaxed text-mirai-text-secondary ${
          isLong && !isExpanded ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="mt-1 text-xs font-bold text-primary-accent hover:opacity-70"
        >
          {isExpanded ? "閉じる" : "続きを読む"}
        </button>
      )}
    </div>
  );
}

/**
 * 事業1件分のカード。
 *
 * 以前は文字が等間隔に並ぶだけで、金額の大小も前年度からの変化も読み取れなかった。
 * 市民が知りたいのは「いくら使うのか」「増えたのか減ったのか」なので、
 * 金額を大きく出し、グループ内での相対的な大きさを棒で示し、前年比を添える。
 *
 * 2列に並べるため幅が狭い。バッジ・見出し・金額を横に詰め込むと折り返しが
 * 崩れるので、上から順に積む形にしている。
 */
export function BudgetInitiativeCard({
  initiative,
  maxAmount,
}: BudgetInitiativeCardProps) {
  const amount = initiative.budget_amount;
  const amountLabel = formatYen(amount);
  const diff = diffLabel(amount, initiative.prev_budget_amount);
  const isIncrease =
    amount !== null &&
    initiative.prev_budget_amount !== null &&
    amount > initiative.prev_budget_amount;

  // 金額差が非常に大きいため、極小の事業でも棒が見えるように下限を設ける
  const barWidth =
    amount !== null && maxAmount > 0
      ? Math.max((amount / maxAmount) * 100, 1.5)
      : 0;
  const barRatio =
    amount !== null && maxAmount > 0
      ? Math.round((amount / maxAmount) * 100)
      : 0;

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      {/* バッジは見出しの上に固定で置く。見出しの長さで位置がずれないようにする */}
      <div className="flex flex-wrap items-center gap-1.5">
        <BudgetInitiativeBadge
          badge={
            initiative.badge as
              | "new"
              | "expanded"
              | "continued"
              | "reduced"
              | null
          }
        />
        {initiative.basic_plan_theme && (
          <BasicPlanThemeTag label={initiative.basic_plan_theme} />
        )}
      </div>

      <h4 className="mt-2 font-bold leading-snug text-mirai-text">
        {initiative.title}
      </h4>

      {amountLabel && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-xl font-bold leading-tight text-mirai-text tabular-nums">
            {amountLabel}
          </p>
          {diff && (
            <p
              className={`text-xs tabular-nums ${
                isIncrease ? "text-primary-accent" : "text-mirai-text-muted"
              }`}
            >
              {diff}
            </p>
          )}
        </div>
      )}

      {/* グループ内での金額の大きさ。数字だけでは規模感が掴みにくいため */}
      {barWidth > 0 && (
        <div
          className="mt-2 h-1.5 w-full rounded-full bg-mirai-surface-grouped"
          title={`このグループで最も大きい事業に対して約${barRatio}%`}
        >
          <div
            className="h-1.5 rounded-full bg-primary"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}

      {initiative.description && (
        <InitiativeDescription text={initiative.description} />
      )}
    </article>
  );
}
