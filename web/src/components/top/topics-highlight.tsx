import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { TopicCard } from "@/features/topics/client/components/topic-card";
import { TOPICS, TOPICS_ON_TOP } from "@/features/topics/shared/data";

/**
 * トップページのトピックス枠。
 * 主語は市・市議会にし、質問した議員個人を目立たせない（詳細は TopicCard 側のコメント参照）。
 */
export function TopicsHighlight() {
  const topics = TOPICS.slice(0, TOPICS_ON_TOP);

  if (topics.length === 0) return null;

  return (
    <section className="rounded-2xl bg-mirai-gradient p-5 sm:p-8">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-primary-accent">
        <Clock className="h-3.5 w-3.5" />
        トピックス
      </span>

      <h2 className="mt-3 text-lg sm:text-xl font-bold text-mirai-text leading-snug">
        暮らしに関わりの大きいテーマ
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-mirai-text-secondary">
        市議会で議論されたことのうち、影響が大きいと考えられるものを、事実と議会での意見に分けてまとめています。
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {topics.map((topic) => (
          <TopicCard key={topic.slug} topic={topic} />
        ))}
      </div>

      <Link
        href="/topics"
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary-accent hover:opacity-70"
      >
        すべてのトピックスを見る（全{TOPICS.length}件）
        <ArrowRight className="h-4 w-4 shrink-0" />
      </Link>
    </section>
  );
}
