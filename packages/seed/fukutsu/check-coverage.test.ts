import { describe, expect, it } from "vitest";
import {
  collectDecidedItems,
  collectQuestioners,
  findCoverageGaps,
} from "./check-coverage";

/** 令和8年2月臨時会の書式。承認第1号が抽出から落ちていた実例 */
const MINUTES_WITH_APPROVAL = [
  "○議長（髙山賢二）　賛成多数であります。したがいまして、承認第１号専決処分した事件の承認について（令和７年度福津市一般会計補正予算（専決第２号））は、承認することに決定いたしました。",
  "○議長（髙山賢二）　賛成多数であります。したがいまして、議案第２号福岡県市町村職員退職手当組合規約の変更については、原案のとおり可決することに決定いたしました。",
].join("\n");

describe("collectDecidedItems", () => {
  it("件名の書き方によらず議決された案件を拾う", () => {
    // 「について（…）は、」と「については、」の両方を数える
    expect([...collectDecidedItems(MINUTES_WITH_APPROVAL)].sort()).toEqual([
      "承認第1号",
      "議案第2号",
    ]);
  });

  it("請願も数える", () => {
    const text =
      "○議長　賛成少数であります。したがいまして、請願第４号福間南小学校の教育環境整備を求める請願は、不採択とすることに決定いたしました。";

    expect([...collectDecidedItems(text)]).toEqual(["請願第4号"]);
  });

  it("議長裁決の言い回しも拾う", () => {
    const text =
      "○議長　可否同数であります。よって、議案第33号福津市下水道条例を改正することについては否決されました。";

    expect([...collectDecidedItems(text)]).toEqual(["議案第33号"]);
  });

  it("1文にまとめて議決されたものは全部数える", () => {
    const text =
      "○議長　したがいまして、議案第４号、議案第５号、議案第６号については、原案のとおり可決することに決定いたしました。";

    expect([...collectDecidedItems(text)].sort()).toEqual([
      "議案第4号",
      "議案第5号",
      "議案第6号",
    ]);
  });

  it("議決していない場面の案件番号は数えない", () => {
    // 日程の読み上げや付託の省略は議決ではない
    const text = [
      "　日程第５　承認第１号　専決処分した事件の承認について",
      "○議長　お諮りします。承認第１号につきましては、委員会への付託を省略したいと思いますが、これにご異議ございませんか。",
    ].join("\n");

    expect([...collectDecidedItems(text)]).toEqual([]);
  });
});

describe("collectQuestioners", () => {
  it("一般質問に立った議員を拾う", () => {
    const text = [
      "△日程第１一般質問",
      "○議長（髙山賢二）　３番、山本祐平議員。",
      "◆３番（山本　祐平）　通告に従い、市の財政状況について質問します。",
      "◎市長（福井崇郎）　お答えします。",
      "○議長（髙山賢二）　以上で、３番、山本祐平議員の一般質問を終わります。",
      "○議長（髙山賢二）　４番、岩下豊議員。",
      "◆４番（岩下　豊）　高齢者福祉について質問します。",
      "◎市長（福井崇郎）　お答えします。",
      "○議長（髙山賢二）　以上で、４番、岩下豊議員の一般質問を終わります。",
    ].join("\n");

    expect([...collectQuestioners(text)].sort()).toEqual(["山本祐平", "岩下豊"]);
  });
});

describe("findCoverageGaps", () => {
  it("会議録にあってデータに無いものを取りこぼしとして返す", () => {
    const result = findCoverageGaps({
      minutes: [MINUTES_WITH_APPROVAL],
      seededBillNumbers: ["議案第2号"],
      seededQuestioners: [],
    });

    expect(result.decidedCount).toBe(2);
    expect(result.gaps).toEqual([{ kind: "議案", missing: ["承認第1号"] }]);
  });

  it("すべて入っていれば取りこぼし無しを返す", () => {
    const result = findCoverageGaps({
      minutes: [MINUTES_WITH_APPROVAL],
      seededBillNumbers: ["承認第1号", "議案第2号"],
      seededQuestioners: [],
    });

    expect(result.gaps).toEqual([]);
  });

  it("一般質問の議員が抜けていれば取りこぼしとして返す", () => {
    const minutes = [
      "○議長（髙山賢二）　３番、山本祐平議員。",
      "◆３番（山本　祐平）　市の財政状況について質問します。",
      "○議長（髙山賢二）　以上で、３番、山本祐平議員の一般質問を終わります。",
    ].join("\n");

    const result = findCoverageGaps({
      minutes: [minutes],
      seededBillNumbers: [],
      seededQuestioners: [],
    });

    expect(result.questionerCount).toBe(1);
    expect(result.gaps).toEqual([{ kind: "一般質問", missing: ["山本祐平"] }]);
  });

  it("氏名の全角スペースの有無で取りこぼし扱いにしない", () => {
    // 会議録は「山本　祐平」、データ側は「山本祐平」と書かれていることがある
    const minutes = [
      "○議長（髙山賢二）　３番、山本祐平議員。",
      "◆３番（山本　祐平）　市の財政状況について質問します。",
      "○議長（髙山賢二）　以上で、３番、山本祐平議員の一般質問を終わります。",
    ].join("\n");

    const result = findCoverageGaps({
      minutes: [minutes],
      seededBillNumbers: [],
      seededQuestioners: ["山本　祐平"],
    });

    expect(result.gaps).toEqual([]);
  });

  it("データにあって会議録に無いものは取りこぼしにしない", () => {
    // 議案書や議決結果一覧など、会議録以外の資料から載せているものがある
    const result = findCoverageGaps({
      minutes: [MINUTES_WITH_APPROVAL],
      seededBillNumbers: ["承認第1号", "議案第2号", "議案第99号"],
      seededQuestioners: [],
    });

    expect(result.gaps).toEqual([]);
  });
});
