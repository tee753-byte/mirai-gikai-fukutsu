/**
 * 令和8年3月定例会の総括質疑「やり取りを追う」用のダイジェスト。
 *
 * 書き方の決まりは digest-r8-3/index.ts と同じ（全定例会・全質疑種別で統一）。
 * - 出どころは fukutsu/data/r8-3-sokatsu-transcripts.json（会議録の発言そのまま）
 * - 往復の回数は減らさない。1発言は1〜2文（60字前後）
 * - かみ合っていたか等の評価は書かない。数字・固有名詞は原文どおり
 * - 大項目の見出しは general-questions-sokatsu-r8-3.ts の topics[].title と1字も違わない
 *
 * 【総括質疑ならではの読み方】
 * 総括質疑は、議員が通告した項目をまとめて読み上げ→市側が一括で答弁→そのあと
 * 項目ごとに再質疑・再々質疑、という進み方をする。通告と第一答弁は
 * question_summary / answer_summary に入っているので、ここには再質疑以降を入れる。
 * point は原文の小項目番号（①②…）に合わせ、番号がそのまま論点になるようにしている。
 *
 * この会期の総括質疑は令和8年度当初予算と臨時行財政運営方針に対するもので、
 * 3人が3月9日に登壇した。
 */
import type { SeedTopicExchange } from "../general-questions-types";
import { kuramotoToshinori } from "./kuramoto-toshinori";
import { mamedaYuko } from "./mameda-yuko";
import { ojimaTakehiro } from "./ojima-takehiro";

/** 議員名（空白なし） → 大項目の見出し → 論点ごとのやり取り */
export const digestSokatsuR8_3: Record<
  string,
  Record<string, SeedTopicExchange[]>
> = {
  尾島武弘: ojimaTakehiro,
  倉元敏徳: kuramotoToshinori,
  豆田優子: mamedaYuko,
};
