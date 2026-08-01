"use client";

import { ChevronDown, ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Topic } from "../../shared/types";

type TopicCardProps = {
  topic: Topic;
  /** 初期状態で中身を開いておくか（トピックス一覧の先頭など） */
  defaultOpen?: boolean;
};

function OutcomeBadge({ topic }: { topic: Topic }) {
  if (!topic.outcome) return null;

  return (
    <Badge
      variant={topic.outcome === "approved" ? "billApproved" : "billRejected"}
    >
      {topic.outcome === "approved" ? "可決" : "否決"}
    </Badge>
  );
}

export function TopicCard({ topic, defaultOpen = false }: TopicCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const forStances = topic.stances.filter((s) => s.side === "for");
  const againstStances = topic.stances.filter((s) => s.side === "against");
  const hasStances = topic.stances.length > 0;

  return (
    // id はトップページの一覧カードからの遷移先（/topics#slug）。
    // ヘッダーに隠れないよう scroll-mt を付けている
    <article
      id={topic.slug}
      className="bg-card rounded-lg border border-border p-5 scroll-mt-24"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <OutcomeBadge topic={topic} />
        <span className="text-xs text-mirai-text-muted">
          {topic.sessionLabel}・{topic.occurredOn}
        </span>
      </div>

      <h2 className="mt-2 text-base sm:text-lg font-bold text-mirai-text leading-snug">
        {topic.title}
      </h2>

      {topic.outcomeNote && (
        <p className="mt-1 text-xs text-mirai-text-muted">
          {topic.outcomeNote}
        </p>
      )}

      <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
        {topic.lead}
      </p>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="mt-3 flex items-center gap-1 text-sm font-bold text-primary-accent hover:opacity-70">
          {isOpen ? "閉じる" : "くわしく見る"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-5">
          <section>
            <h3 className="text-sm font-bold text-mirai-text">
              確認できる事実
            </h3>
            <p className="mt-0.5 text-xs text-mirai-text-muted">
              市の答弁と議決結果にもとづく内容です。
            </p>
            <ul className="mt-2 space-y-2">
              {topic.facts.map((fact) => (
                <li
                  key={fact}
                  className="text-sm leading-relaxed text-mirai-text-secondary border-l-2 border-primary-accent pl-3"
                >
                  {fact}
                </li>
              ))}
            </ul>
          </section>

          {hasStances && (
            <section>
              <h3 className="text-sm font-bold text-mirai-text">
                議会での主な意見
              </h3>
              <p className="mt-0.5 text-xs text-mirai-text-muted">
                議員が討論で述べた主張です。事実の認定ではありません。どの議員の発言かは会議録で確認できます。
              </p>

              {againstStances.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-mirai-text-secondary">
                    反対の立場から
                  </p>
                  <ul className="mt-1 space-y-2">
                    {againstStances.map((stance) => (
                      <li
                        key={stance.text}
                        className="text-sm leading-relaxed text-mirai-text-secondary bg-mirai-surface-grouped rounded-md px-3 py-2"
                      >
                        {stance.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {forStances.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-mirai-text-secondary">
                    賛成の立場から
                  </p>
                  <ul className="mt-1 space-y-2">
                    {forStances.map((stance) => (
                      <li
                        key={stance.text}
                        className="text-sm leading-relaxed text-mirai-text-secondary bg-mirai-surface-grouped rounded-md px-3 py-2"
                      >
                        {stance.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {topic.stanceNote && (
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-mirai-text-muted">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {topic.stanceNote}
            </p>
          )}

          <section>
            <h3 className="text-sm font-bold text-mirai-text">出典</h3>
            <ul className="mt-1 space-y-1">
              {topic.sources.map((source) => (
                <li key={source.href}>
                  <Link
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-mirai-text-muted hover:text-mirai-text"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {source.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}
