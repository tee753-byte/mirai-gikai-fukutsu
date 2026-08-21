/**
 * 令和8年6月定例会の一般質問「やり取りを追う」用のダイジェスト。
 *
 * 「要約」は通告の質問要旨と第一答弁だけなので、議員がその場で食い下がった部分が落ちる。
 * 一方で原文は1人あたり12,000〜27,000字あり読み切れない。
 * その中間として、論点ごとに往復を圧縮したものをここに持つ。
 *
 * ■ 書き方の決まり（全議員で同じにする。digest-r8-3/index.ts と同じ）
 * - 出どころは fukutsu/data/r8-6-transcripts.json（会議録の発言そのまま）
 * - **往復の回数は減らさない**。何回食い下がったかは、その議員がどこを掘ったかを
 *   表す情報なので、削らずに1発言あたりの長さのほうを詰める
 * - 1発言は1〜2文（60字前後）。読み通せる分量に収めるための上限
 * - **かみ合っていたか、答えになっていたかといった評価は書かない**。
 *   読んだ人が判断できるよう、問いと答えを並べるだけにする
 * - 数字・固有名詞は原文どおりにする（丸めない）
 * - 論点の見出しは、通告の①②…がある議員はそれに合わせる。
 *   無い議員は、やり取りのまとまりごとに付ける
 *
 * ■ ファイルの分け方
 * 議員1人につき1ファイル。1人ずつ足していけるようにしてある。
 * 大項目の見出しは general-questions-r8-6.ts の topics[].title と
 * 1字も違わないように書く（違うと突き合わせに失敗し、シード時に警告が出る）。
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
export const digestR8_6: Record<string, Record<string, SeedTopicExchange[]>> = {
  秦浩: hataHiroshi,
  中村清隆: nakamuraKiyotaka,
  井手口忠信: ideguchiTadanobu,
  大山隆之: oyamaTakayuki,
  倉元敏徳: kuramotoToshinori,
  榎本博: enomotoHiroshi,
  石田まなみ: ishidaManami,
  山本祐平: yamamotoYuhei,
  中村晶代: nakamuraAkiyo,
  岩下豊: iwashitaYutaka,
  豆田優子: mamedaYuko,
  尾島武弘: ojimaTakehiro,
  中村恵輔: nakamuraKeisuke,
  戸田進一: todaShinichi,
  佐伯美保: saekiMiho,
};
