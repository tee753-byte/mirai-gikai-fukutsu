/**
 * 令和7年12月定例会の一般質問「やり取りを追う」用のダイジェスト。
 *
 * 書き方の決まりは digest-r8-3/index.ts と同じ（全定例会で統一）。
 * - 出どころは fukutsu/data/r7-12-transcripts.json（会議録の発言そのまま）
 * - 往復の回数は減らさない。1発言は1〜2文（60字前後）
 * - かみ合っていたか等の評価は書かない。数字・固有名詞は原文どおり
 * - 大項目の見出しは general-questions-r7-12.ts の topics[].title と1字も違わない
 *
 * ファイルの分け方は議員1人につき1ファイル。
 */
import type { SeedTopicExchange } from "../general-questions-types";
import { enomotoHiroshi } from "./enomoto-hiroshi";
import { hataHiroshi } from "./hata-hiroshi";
import { ideguchiTadanobu } from "./ideguchi-tadanobu";
import { ishidaManami } from "./ishida-manami";
import { iwashitaYutaka } from "./iwashita-yutaka";
import { kuramotoToshinori } from "./kuramoto-toshinori";
import { mamedaYuko } from "./mameda-yuko";
import { nakamuraAkiyo } from "./nakamura-akiyo";
import { nakamuraKeisuke } from "./nakamura-keisuke";
import { nakamuraKiyotaka } from "./nakamura-kiyotaka";
import { ojimaTakehiro } from "./ojima-takehiro";
import { oyamaTakayuki } from "./oyama-takayuki";
import { saekiMiho } from "./saeki-miho";
import { todaShinichi } from "./toda-shinichi";
import { yamamotoYuhei } from "./yamamoto-yuhei";

/** 議員名（空白なし） → 大項目の見出し → 論点ごとのやり取り */
export const digestR7_12: Record<string, Record<string, SeedTopicExchange[]>> = {
  秦浩: hataHiroshi,
  山本祐平: yamamotoYuhei,
  大山隆之: oyamaTakayuki,
  石田まなみ: ishidaManami,
  中村恵輔: nakamuraKeisuke,
  井手口忠信: ideguchiTadanobu,
  榎本博: enomotoHiroshi,
  中村清隆: nakamuraKiyotaka,
  豆田優子: mamedaYuko,
  戸田進一: todaShinichi,
  岩下豊: iwashitaYutaka,
  佐伯美保: saekiMiho,
  倉元敏徳: kuramotoToshinori,
  中村晶代: nakamuraAkiyo,
  尾島武弘: ojimaTakehiro,
};
