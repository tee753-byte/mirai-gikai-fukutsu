import { describe, expect, it } from "vitest";
import type { SeedGeneralQuestion } from "./general-questions-types";
import { type DigestMap, mergeDigest } from "./merge-digest";

const QUESTIONS: SeedGeneralQuestion[] = [
  {
    // 会議録の氏名は全角スペース入り
    questioner_name: "山本　祐平",
    questioner_party: "無所属",
    question_order: 1,
    summary: "市の財政状況について質問しました。",
    topics: [
      {
        title: "本市の財政状況及び市政運営について",
        question_summary: "災害復旧の財源などを問う。",
        answer_summary: "国・県支出金や地方債を活用する。",
        answerer_role: "市長",
        answerer_name: "福井崇郎",
      },
    ],
  },
  {
    questioner_name: "岩下　豊",
    questioner_party: "日本共産党",
    question_order: 2,
    summary: "高齢者福祉について質問しました。",
    topics: [
      {
        title: "高齢者福祉について",
        question_summary: "支援体制を問う。",
        answer_summary: "地域包括支援センターを中心に連携する。",
        answerer_role: "市長",
        answerer_name: "福井崇郎",
      },
    ],
  },
];

const DIGEST: DigestMap = {
  山本祐平: {
    本市の財政状況及び市政運営について: [
      {
        point: "① 災害復旧20億円の財源",
        turns: [
          { side: "questioner", text: "財源の内訳は。" },
          {
            side: "answerer",
            role: "経営企画部長",
            name: "花田積",
            text: "国・県が約10億円、地方債が約6億円。",
          },
        ],
      },
    ],
  },
};

describe("mergeDigest", () => {
  it("氏名の全角スペースを無視して突き合わせる", () => {
    const { questions } = mergeDigest(QUESTIONS, DIGEST);

    expect(questions[0].topics[0].exchanges).toHaveLength(1);
    expect(questions[0].topics[0].exchanges?.[0].point).toBe(
      "① 災害復旧20億円の財源"
    );
  });

  it("ダイジェストが無い議員の topics はそのまま", () => {
    const { questions } = mergeDigest(QUESTIONS, DIGEST);

    expect(questions[1].topics[0].exchanges).toBeUndefined();
  });

  it("元の配列を書き換えない", () => {
    mergeDigest(QUESTIONS, DIGEST);

    expect(QUESTIONS[0].topics[0].exchanges).toBeUndefined();
  });

  it("流し込めた論点の数を返す", () => {
    expect(mergeDigest(QUESTIONS, DIGEST).mergedCount).toBe(1);
  });

  it("見出しが一致しないものを unmatched で知らせる", () => {
    const typo: DigestMap = {
      山本祐平: { 本市の財政状況について: DIGEST.山本祐平[Object.keys(DIGEST.山本祐平)[0]] },
    };

    const { unmatched, mergedCount } = mergeDigest(QUESTIONS, typo);

    expect(unmatched).toEqual(["山本祐平／本市の財政状況について"]);
    expect(mergedCount).toBe(0);
  });

  it("議員名が一致しないものも unmatched で知らせる", () => {
    const wrongName: DigestMap = {
      存在しない議員: { どこかの見出し: [] },
    };

    expect(mergeDigest(QUESTIONS, wrongName).unmatched).toEqual([
      "存在しない議員／どこかの見出し",
    ]);
  });

  it("ダイジェストが空なら何も起きない", () => {
    const { questions, unmatched, mergedCount } = mergeDigest(QUESTIONS, {});

    expect(questions[0].topics[0].exchanges).toBeUndefined();
    expect(unmatched).toEqual([]);
    expect(mergedCount).toBe(0);
  });
});
