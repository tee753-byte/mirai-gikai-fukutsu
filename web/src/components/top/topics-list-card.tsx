import { ArrowRight, Megaphone } from "lucide-react";
import Link from "next/link";
import { TOPICS, TOPICS_ON_TOP_LIST } from "@/features/topics/shared/data";

/**
 * トップページのトピックス枠（一覧カード版）。
 *
 * 福岡県版の「知事記者会見 最新情報」と同じ構成にしている。
 * 見出しだけを並べて全体像を先に見せ、事実と議員の意見の切り分けは
 * 遷移先の /topics（TopicCard）に任せる。
 *
 * 詳しい版（各トピックを展開できる TopicsHighlight）も残してあるので、
 * page.tsx の読み込みを差し替えれば元に戻せる。
 */
export function TopicsListCard() {
  const topics = TOPICS.slice(0, TOPICS_ON_TOP_LIST);

  if (topics.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 bg-mirai-gradient px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-mirai-text sm:text-base">
          <Megaphone className="h-4 w-4 shrink-0 text-primary-accent" />
          トピックス
        </h2>
        <span className="shrink-0 text-xs text-mirai-text-secondary">
          全{TOPICS.length}件
        </span>
      </div>

      <ul className="flex flex-col gap-2.5 px-4 py-4 sm:px-5">
        {topics.map((topic) => (
          <li key={topic.slug} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            />
            <Link
              href={`/topics#${topic.slug}`}
              className="group flex-1 text-sm font-medium leading-relaxed text-mirai-text hover:text-primary-accent"
            >
              {/*
                文字の下半分だけに色を敷いて、蛍光ペンで線を引いたように見せる。
                下線だと他のリンクと区別がつかず、全体を塗ると読みにくくなる。
              */}
              <span className="bg-[linear-gradient(transparent_62%,var(--color-topic-marker)_62%)] group-hover:bg-[linear-gradient(transparent_62%,var(--color-topic-marker-hover)_62%)]">
                {topic.title}
              </span>
            </Link>
            {topic.isNew && (
              <span className="mt-0.5 shrink-0 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                NEW!!
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-border px-4 py-3 text-right sm:px-5">
        <Link
          href="/topics"
          className="inline-flex items-center gap-1 text-sm font-bold text-primary-accent hover:opacity-70"
        >
          トピックスの詳細を読む
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>
    </section>
  );
}
