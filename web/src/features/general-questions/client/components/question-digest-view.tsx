"use client";

import type { GeneralQuestionTopic, TopicTurn } from "../../shared/types";
import {
  ChatBubbleAnswer,
  ChatBubbleQuestion,
  TopicChip,
} from "./question-chat-view";

/**
 * 「やり取りを追う」表示。
 *
 * 「要約」は通告の質問要旨と第一答弁だけなので、議員がその場で食い下がった部分が落ちる。
 * 原文は1人あたり2万字前後あって読み切れない。その中間として、
 * 論点ごとに往復を数回まで圧縮したものを会話形式で並べる。
 */
export function QuestionDigestView({
  topics,
}: {
  topics: GeneralQuestionTopic[];
}) {
  const withExchanges = topics.filter((t) => (t.exchanges?.length ?? 0) > 0);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs leading-relaxed text-mirai-text-secondary">
        公式会議録のやり取りを、論点ごとにAIが要約したものです。更質問（2回目以降の質問）も含みます。
      </p>

      {withExchanges.map((topic, ti) => (
        <section key={`${topic.title}-${ti}`} className="flex flex-col gap-6">
          {/* 大項目が複数あるときだけ見出しを出す。1つのときは重複して邪魔になる */}
          {withExchanges.length > 1 && <TopicChip>{topic.title}</TopicChip>}

          {topic.exchanges?.map((exchange, ei) => (
            <div
              key={`${exchange.point}-${ei}`}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4"
            >
              <h3 className="text-sm font-bold text-mirai-text">
                {exchange.point}
              </h3>
              {exchange.turns.map((turn, i) => (
                <Turn
                  key={`${i}-${turn.text.slice(0, 12)}`}
                  turn={turn}
                  label={turnLabel(exchange.turns, i)}
                />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

/**
 * 何回目のやり取りかを示すラベル。
 * 1回目には付けず、2回目以降だけ「更質問」「再答弁」と出して区別できるようにする。
 */
function turnLabel(turns: TopicTurn[], index: number): string | undefined {
  const nth = turns
    .slice(0, index + 1)
    .filter((t) => t.side === turns[index].side).length;

  if (nth === 1) return undefined;
  if (turns[index].side === "questioner") {
    return nth === 2 ? "更質問" : `更質問（${nth}回目）`;
  }
  return "再答弁";
}

function Turn({ turn, label }: { turn: TopicTurn; label?: string }) {
  if (turn.side === "questioner") {
    return <ChatBubbleQuestion text={turn.text} label={label} />;
  }

  return (
    <ChatBubbleAnswer
      text={turn.text}
      role={label ? `${turn.role ?? ""}（${label}）` : (turn.role ?? "")}
      name={turn.name ?? ""}
    />
  );
}
