"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { BudgetTheme, BudgetInitiative } from "../../shared/types";
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full text-left">
        <div className="flex items-start justify-between gap-3 p-4 bg-mirai-surface-grouped rounded-lg hover:bg-mirai-surface-muted transition-colors">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-mirai-text">{theme.title}</h3>
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

export function BudgetThemeAccordion({ themes }: BudgetThemeAccordionProps) {
  if (themes.length === 0) {
    return (
      <p className="text-mirai-text-muted text-center py-6">
        テーマ情報がありません。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {themes.map((theme) => (
        <ThemeItem key={theme.id} theme={theme} />
      ))}
    </div>
  );
}
