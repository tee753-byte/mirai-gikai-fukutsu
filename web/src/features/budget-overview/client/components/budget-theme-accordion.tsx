"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { BudgetInitiative, BudgetTheme } from "../../shared/types";
import { BasicPlanThemeTag } from "./basic-plan-theme-tag";
import { BudgetInitiativeBadge } from "./budget-initiative-badge";

type BudgetThemeWithInitiatives = BudgetTheme & {
  initiatives: BudgetInitiative[];
};

type BudgetThemeAccordionProps = {
  themes: BudgetThemeWithInitiatives[];
};

/** 説明文が長い事業は、初期状態では3行に折りたたんでおく */
function InitiativeDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 80;

  return (
    <div className="mt-1">
      <p
        className={`text-sm text-mirai-text-secondary ${
          isLong && !isExpanded ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="mt-1 text-xs font-semibold text-primary-accent hover:opacity-70"
        >
          {isExpanded ? "閉じる" : "続きを読む"}
        </button>
      )}
    </div>
  );
}

function formatYen(amount: number | null): string | null {
  if (amount === null) return null;
  // budget_initiatives.budget_amount は千円単位で保存する
  const yen = amount * 1000;
  if (yen >= 100000000) {
    return `${(yen / 100000000).toFixed(1).replace(/\.0$/, "")}億円`;
  }
  if (yen >= 10000) {
    return `${Math.round(yen / 10000).toLocaleString()}万円`;
  }
  return `${yen.toLocaleString()}円`;
}

function ThemeItem({ theme }: { theme: BudgetThemeWithInitiatives }) {
  const [isOpen, setIsOpen] = useState(true);

  // グループの合計額。事業を1件ずつ見なくても規模感が分かるようにする
  const total = theme.initiatives.reduce(
    (sum, i) => sum + (i.budget_amount ?? 0),
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
        <ul className="mt-2 space-y-2 pl-2">
          {theme.initiatives.map((initiative) => {
            const amountLabel = formatYen(initiative.budget_amount);
            return (
              <li
                key={initiative.id}
                className="border-l-2 border-primary-accent pl-4 py-2"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-mirai-text">
                      {initiative.title}
                    </span>
                    <BudgetInitiativeBadge
                      badge={
                        initiative.badge as
                          | "new"
                          | "expanded"
                          | "continued"
                          | null
                      }
                    />
                    {initiative.basic_plan_theme && (
                      <BasicPlanThemeTag label={initiative.basic_plan_theme} />
                    )}
                  </div>
                  {amountLabel && (
                    <span className="text-sm font-bold text-mirai-text shrink-0">
                      {amountLabel}
                    </span>
                  )}
                </div>
                {initiative.description && (
                  <InitiativeDescription text={initiative.description} />
                )}
              </li>
            );
          })}
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
