import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import {
  DEFERRED_MAYOR_PLEDGES,
  MAYOR_PLEDGES_ANSWERED_DATE,
  MAYOR_PLEDGES_SOURCE,
} from "./mayor-pledges-topic.data";

/**
 * TOPページの特集枠プロトタイプ。「市長公約の先送り」を扱う。
 * 主語は市長（執行部）にし、質問した議員個人を目立たせない（質問者名は掲載しない）。
 * 評価コメントは書かず、答弁で言及された事実（見送る公約と答弁日）だけを並べる。
 */
export function MayorPledgesTopic() {
  return (
    <div className="rounded-2xl bg-mirai-gradient p-6 sm:p-8">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-primary-accent">
        <Clock className="h-3.5 w-3.5" />
        特集
      </span>

      <h2 className="mt-3 text-lg sm:text-xl font-bold text-mirai-text leading-snug">
        市長選挙時の公約のうち、当面見送られているもの
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
        市の財政状況を踏まえた今後2年間の臨時行財政運営方針の中で、市長は
        {MAYOR_PLEDGES_ANSWERED_DATE}
        の一般質問で、下記の公約について実施を見送ると答弁しています（2年後に状況を見て優先順位を判断するとしています）。
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {DEFERRED_MAYOR_PLEDGES.map((pledge) => (
          <li key={pledge.label} className="rounded-lg bg-white/70 px-4 py-3">
            <span className="text-sm font-bold text-mirai-text">
              {pledge.label}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={MAYOR_PLEDGES_SOURCE.href}
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary-accent hover:opacity-70"
      >
        {MAYOR_PLEDGES_SOURCE.label}
        <ArrowRight className="h-4 w-4 shrink-0" />
      </Link>
    </div>
  );
}
