"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { BudgetInitiative, BudgetTheme } from "../../shared/types";
import { BudgetInitiativeCard, formatYen } from "./budget-initiative-card";

type BudgetThemeWithInitiatives = BudgetTheme & {
  initiatives: BudgetInitiative[];
};

type BudgetThemeAccordionProps = {
  themes: BudgetThemeWithInitiatives[];
};

function ThemeItem({ theme }: { theme: BudgetThemeWithInitiatives }) {
  const [isOpen, setIsOpen] = useState(true);

  // グループの合計額。事業を1件ずつ見なくても規模感が分かるようにする
  const total = theme.initiatives.reduce(
    (sum, i) => sum + (i.budget_amount ?? 0),
    0
  );
  // 各カードの棒の長さは、同じグループの中で一番大きい事業を基準にする
  const maxAmount = Math.max(
    ...theme.initiatives.map((i) => i.budget_amount ?? 0),
    0
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full text-left">
        <div className="flex items-start justify-between gap-3 p-4 bg-mirai-surface-grouped rounded-lg hover:bg-mirai-surface-muted transition-colors">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-mirai-text">{theme.title}</h3>
            <p className="mt-0.5 text-xs text-mirai-text-muted">
              {theme.initiatives.length}事業
              {total > 0 && ` ・ 合計 ${formatYen(total)}`}
            </p>
            {theme.ai_summary && (
              <p className="mt-1 text-sm text-mirai-text-secondary">
                {theme.ai_summary}
              </p>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 shrink-0 text-mirai-text-muted transition-transform duration-200 mt-0.5 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {/* 事業数が多いので、画面に余裕がある幅では2列に並べて縦の長さを抑える */}
        <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {theme.initiatives.map((initiative) => (
            <li key={initiative.id}>
              <BudgetInitiativeCard
                initiative={initiative}
                maxAmount={maxAmount}
              />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * まちづくり基本構想のテーマで絞り込むボタン列。
 *
 * 事業数が多いと目的の分野にたどり着けないため、「子育て・教育の予算だけ見たい」
 * といった読み方ができるようにする。掲載のあるテーマだけを、件数付きで出す。
 */
function ThemeFilter({
  options,
  selected,
  onSelect,
  totalCount,
}: {
  options: { label: string; count: number }[];
  selected: string | null;
  onSelect: (label: string | null) => void;
  totalCount: number;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-bold text-mirai-text mb-2">
        まちづくり基本構想のテーマで絞り込む
      </p>
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={selected === null}
          onClick={() => onSelect(null)}
          label={`すべて（${totalCount}）`}
        />
        {options.map((o) => (
          <FilterChip
            key={o.label}
            active={selected === o.label}
            onClick={() => onSelect(selected === o.label ? null : o.label)}
            // タグと同じく「：」より前だけを出して短くする
            label={`${o.label.split("：")[0]}（${o.count}）`}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
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
      {label}
    </button>
  );
}

/**
 * カードの棒が何を表しているかの説明。
 *
 * 棒だけを出しても基準が分からないと読み方を誤る。特に、棒の長さは
 * グループごとの最大額を基準にしているため、グループをまたいだ比較はできない。
 * その注意までを短く添える。
 */
function BarLegend() {
  return (
    <div className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-mirai-text-muted">
      <span
        aria-hidden="true"
        className="mt-1.5 h-1.5 w-8 shrink-0 rounded-full bg-primary"
      />
      <span>
        カードの棒は事業費の大きさです。
        <strong className="font-bold text-mirai-text-secondary">
          同じグループの中で一番大きい事業
        </strong>
        を基準にしているため、グループをまたいだ長さの比較はできません。
      </span>
    </div>
  );
}

export function BudgetThemeAccordion({ themes }: BudgetThemeAccordionProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  if (themes.length === 0) {
    return (
      <p className="text-mirai-text-muted text-center py-6">
        テーマ情報がありません。
      </p>
    );
  }

  // 掲載のあるテーマと件数を数える（原本の並び順を保つため出現順）
  const counts = new Map<string, number>();
  let totalCount = 0;
  for (const theme of themes) {
    for (const initiative of theme.initiatives) {
      totalCount += 1;
      const label = initiative.basic_plan_theme;
      if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  const options = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const filtered = selectedTheme
    ? themes
        .map((theme) => ({
          ...theme,
          initiatives: theme.initiatives.filter(
            (i) => i.basic_plan_theme === selectedTheme
          ),
        }))
        // 該当する事業が無いグループは、見出しだけ残しても意味がないので隠す
        .filter((theme) => theme.initiatives.length > 0)
    : themes;

  const filteredCount = filtered.reduce(
    (sum, t) => sum + t.initiatives.length,
    0
  );

  return (
    <div>
      {options.length > 1 && (
        <ThemeFilter
          options={options}
          selected={selectedTheme}
          onSelect={setSelectedTheme}
          totalCount={totalCount}
        />
      )}

      <BarLegend />

      {selectedTheme && (
        <p className="mb-3 text-sm text-mirai-text-secondary">
          <span className="font-bold text-mirai-text">{filteredCount}事業</span>
          を表示しています（全{totalCount}事業のうち）
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((theme) => (
          // 絞り込むと中身が変わるので、キーに条件を混ぜて開閉状態を作り直す
          <ThemeItem
            key={`${theme.id}-${selectedTheme ?? "all"}`}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}
