"use client";

type BasicPlanThemeTagProps = {
  /** BASIC_PLAN_THEMES の label（「安全安心：安全・安心・快適に住み続けられるまち」等） */
  label: string;
};

/** タグには「：」より前の短い名前だけを表示する（全文は基本構想の説明欄で見せる） */
export function BasicPlanThemeTag({ label }: BasicPlanThemeTagProps) {
  const shortLabel = label.split("：")[0];

  return (
    <span className="bg-mirai-surface-muted text-mirai-text-secondary text-xs font-semibold px-2 py-0.5 rounded">
      {shortLabel}
    </span>
  );
}
