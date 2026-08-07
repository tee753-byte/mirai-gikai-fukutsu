import {
  Baby,
  Briefcase,
  Building2,
  Circle,
  Globe,
  Heart,
  Landmark,
  Leaf,
  Shield,
  Stethoscope,
  Trophy,
} from "lucide-react";
import type { GeneralQuestion } from "../../shared/types";
import type { TopicGroup } from "../../shared/utils/build-topic-groups";
import { buildTopicGroups } from "../../shared/utils/build-topic-groups";
import { TopicCard } from "./topic-card";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Baby,
  Shield,
  Heart,
  Stethoscope,
  Building2,
  Leaf,
  Trophy,
  Globe,
  Landmark,
  Briefcase,
  Circle,
};

const CATEGORY_STYLE: Record<
  string,
  { card: string; header: string; text: string; iconBg: string }
> = {
  "子育て・教育": {
    card: "bg-sky-50 border-sky-200",
    header: "bg-white/60 border-sky-200",
    text: "text-sky-700",
    iconBg: "bg-sky-100",
  },
  "防災・安全": {
    card: "bg-orange-50 border-orange-200",
    header: "bg-white/60 border-orange-200",
    text: "text-orange-700",
    iconBg: "bg-orange-100",
  },
  "高齢者・福祉": {
    card: "bg-rose-50 border-rose-200",
    header: "bg-white/60 border-rose-200",
    text: "text-rose-700",
    iconBg: "bg-rose-100",
  },
  "健康・医療": {
    card: "bg-teal-50 border-teal-200",
    header: "bg-white/60 border-teal-200",
    text: "text-teal-700",
    iconBg: "bg-teal-100",
  },
  "交通・まちづくり": {
    card: "bg-violet-50 border-violet-200",
    header: "bg-white/60 border-violet-200",
    text: "text-violet-700",
    iconBg: "bg-violet-100",
  },
  "環境・脱炭素": {
    card: "bg-emerald-50 border-emerald-200",
    header: "bg-white/60 border-emerald-200",
    text: "text-emerald-700",
    iconBg: "bg-emerald-100",
  },
  "スポーツ・文化": {
    card: "bg-indigo-50 border-indigo-200",
    header: "bg-white/60 border-indigo-200",
    text: "text-indigo-700",
    iconBg: "bg-indigo-100",
  },
  "地域・国際交流": {
    card: "bg-amber-50 border-amber-200",
    header: "bg-white/60 border-amber-200",
    text: "text-amber-700",
    iconBg: "bg-amber-100",
  },
  "行政・財政": {
    card: "bg-slate-50 border-slate-200",
    header: "bg-white/60 border-slate-200",
    text: "text-slate-700",
    iconBg: "bg-slate-100",
  },
  "産業・経済": {
    card: "bg-cyan-50 border-cyan-200",
    header: "bg-white/60 border-cyan-200",
    text: "text-cyan-700",
    iconBg: "bg-cyan-100",
  },
};

const DEFAULT_STYLE = {
  card: "bg-mirai-surface-muted border-border",
  header: "bg-card border-border",
  text: "text-mirai-text-secondary",
  iconBg: "bg-card",
};

function CategorySection({ group }: { group: TopicGroup }) {
  const Icon = ICON_MAP[group.iconName] ?? Circle;
  const style = CATEGORY_STYLE[group.categoryLabel] ?? DEFAULT_STYLE;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${style.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${style.text}`} />
        </div>
        <h2 className={`font-bold ${style.text}`}>{group.categoryLabel}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {group.entries.map((entry, i) => (
          <TopicCard key={`${entry.title}-${i}`} entry={entry} style={style} />
        ))}
      </div>
    </section>
  );
}

interface SessionTopicsViewProps {
  questions: GeneralQuestion[];
}

export function SessionTopicsView({ questions }: SessionTopicsViewProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-mirai-text-secondary">
        <p>現在、一般質問のデータを準備中です。</p>
        <p className="text-sm mt-2">しばらくお待ちください。</p>
      </div>
    );
  }

  const groups = buildTopicGroups(questions);

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <CategorySection key={group.categoryLabel} group={group} />
      ))}
    </div>
  );
}
