import { ArrowDown, ArrowRight, ArrowUp, Minus } from "lucide-react";
import type { ChangeDirection } from "../../shared/types/jimu-jigyo";

function icon(direction: ChangeDirection) {
  switch (direction) {
    case "up":
      return ArrowUp;
    case "down":
      return ArrowDown;
    case "flat":
      return ArrowRight;
    default:
      return Minus;
  }
}

function colorClass(direction: ChangeDirection): string {
  switch (direction) {
    case "up":
      return "text-jimu-up";
    case "down":
      return "text-jimu-down";
    default:
      return "text-jimu-flat";
  }
}

function rateText(changeRate: number | null): string {
  if (changeRate === null) return "";
  const sign = changeRate >= 0 ? "+" : "";
  return `${sign}${(changeRate * 100).toFixed(1)}%`;
}

type Props = {
  label: string;
  direction: ChangeDirection;
  changeRate: number | null;
  /** 予算の次年度方向（任意） */
  sub?: {
    label: string;
    direction: ChangeDirection;
    changeRate: number | null;
  };
};

/** 3軸方向インジケータ（KPI・予算・効率）の1行 */
export function DirectionBadge({ label, direction, changeRate, sub }: Props) {
  const Icon = icon(direction);
  const color = colorClass(direction);
  const rt = rateText(changeRate);
  return (
    <div className="flex items-center gap-1.5 text-xs flex-wrap">
      <span className="text-mirai-text-muted w-8 shrink-0">{label}</span>
      <Icon className={`w-3.5 h-3.5 ${color}`} aria-hidden />
      {rt && <span className={color}>{rt}</span>}
      {sub && (
        <span className="text-mirai-text-muted ml-1">
          · {sub.label}
          <SubArrow direction={sub.direction} />
          {sub.changeRate !== null && (
            <span className="text-mirai-text-secondary">
              {rateText(sub.changeRate)}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

function SubArrow({ direction }: { direction: ChangeDirection }) {
  const Icon = icon(direction);
  return (
    <Icon
      className={`inline w-3 h-3 mx-0.5 ${colorClass(direction)}`}
      aria-hidden
    />
  );
}
