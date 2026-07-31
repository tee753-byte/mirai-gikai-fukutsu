import { describe, expect, it } from "vitest";
import {
  buildTranscript,
  extractBillNumbers,
  extractNoticeItems,
  normalizeName,
  parseMinutes,
  splitGeneralQuestions,
} from "./parse-minutes";

/**
 * 福津市議会の会議録の書式をそのまま縮めたサンプル。
 * 実ファイルは C:/Users/Work/Desktop/AIwork/会議録/ に置いている
 * （著作権の扱いが未確認のためリポジトリには入れない）。
 */
const SAMPLE_MINUTES = `令和　８年　３月定例会（第３回）

１　議　事　日　程（５日目）
令和８年３月23日
　日程第１　一般質問
２　出席議員は次のとおりである（１６名）
　　議　長　　髙　山　賢　二　　副議長　　中　村　清　隆　　　２番　　中　村　恵　輔

　　　　　　　　　　～～～～～～～～○～～～～～～～～
　　　　　　　　　　　　開議　午前９時30分
○議長（髙山賢二）　ただいまから、令和８年第３回福津市議会定例会を再開いたします。
△日程第１一般質問
○議長（髙山賢二）　日程第１、一般質問を行います。
　本日最初は、議席番号３番、山本議員。
◆３番（山本　祐平）　議席番号３番、山本祐平です。
　通告書に基づき、大きく１点お尋ねいたします。
　本市の財政状況及び市政運営について。
　①番、昨年８月の大雨災害が、本市の財政に与えた影響について。
　②番、多くの課題の中から三つの柱を選定した理由について。
　以上、ご答弁よろしくお願いいたします。
○議長（髙山賢二）　質問に対する答弁です。福井市長。
◎市長（福井崇郎）　１項目めの①からお答えをさせていただきます。
　災害復旧事業の見込みとして、概算で試算をしております。
○議長（髙山賢二）　山本議員。
◆３番（山本祐平）　では、①から伺います。議案第９号との関係を教えてください。
○議長（髙山賢二）　花田経営企画部長。
◎経営企画部長（花田　積）　議案第９号及び議案第45号に計上しております。
○議長（髙山賢二）　以上で、山本議員の一般質問を終わります。
　ここで休憩とし、再開は午前11時10分とします。
○議長（髙山賢二）　議会を再開し、休憩前に引き続き一般質問を行います。
◆１０番（石田まなみ）　議席番号10番、石田まなみです。
　子育て支援について伺います。
○議長（髙山賢二）　薄教育長。
◎教育長（薄俊哉）　お答えいたします。
○議長（髙山賢二）　以上で、石田議員の一般質問を終わります。
`;

/** 議員自身が討論・提案理由説明をするときは ◎ ＋ 議席番号 になる */
const SAMPLE_DEBATE = `○議長（髙山賢二）　これより討論に入ります。
◎３番（山本祐平）　私は議案第９号に反対の立場で討論いたします。
◎総務文教委員長（石田まなみ）　総務文教委員会の審査結果をご報告します。
`;

describe("normalizeName", () => {
  it("氏名の全角スペースを取り除く", () => {
    expect(normalizeName("山本　祐平")).toBe("山本祐平");
    expect(normalizeName("秦　　　　　浩")).toBe("秦浩");
  });
});

describe("extractBillNumbers", () => {
  it("全角・半角の議案番号を半角に揃えて重複を除く", () => {
    expect(
      extractBillNumbers("議案第９号及び議案第45号、再び議案第９号について")
    ).toEqual(["9", "45"]);
  });

  it("議案番号がなければ空配列", () => {
    expect(extractBillNumbers("公園の整備について伺います。")).toEqual([]);
  });
});

describe("extractNoticeItems", () => {
  it("①②などの細目を抜き出す", () => {
    const items = extractNoticeItems(
      "本市の財政状況について。\n①番、大雨災害の影響について。\n②番、三つの柱を選定した理由について。"
    );
    expect(items).toEqual([
      "番、大雨災害の影響について。",
      "番、三つの柱を選定した理由について。",
    ]);
  });
});

describe("parseMinutes", () => {
  const blocks = parseMinutes(SAMPLE_MINUTES);

  it("名簿など発言者行より前の行は取り込まない", () => {
    expect(blocks[0].speakerType).toBe("chairperson");
    expect(blocks[0].text).toContain("再開いたします");
    expect(blocks.some((b) => b.text.includes("出席議員"))).toBe(false);
  });

  it("◆は質問者として、議席番号を半角に揃えて取る", () => {
    const q = blocks.filter((b) => b.speakerType === "questioner");
    expect(q.map((b) => `${b.speakerNumber}:${b.speakerName}`)).toEqual([
      "3:山本祐平",
      "3:山本祐平",
      "10:石田まなみ",
    ]);
  });

  it("◎＋役職名は答弁者として役職を保持する", () => {
    const a = blocks.filter((b) => b.speakerType === "answerer");
    expect(a.map((b) => b.speakerRole)).toEqual([
      "市長",
      "経営企画部長",
      "教育長",
    ]);
    expect(a[1].speakerName).toBe("花田積");
  });

  it("発言者行の直後の本文と続きの行を1ブロックにまとめる", () => {
    const first = blocks.find((b) => b.speakerType === "questioner");
    expect(first?.text).toContain("議席番号３番、山本祐平です。");
    expect(first?.text).toContain("②番、多くの課題");
  });

  it("△の日程見出しは発言に混ぜない", () => {
    expect(blocks.some((b) => b.text.includes("日程第１一般質問"))).toBe(false);
  });

  it("◎＋議席番号は答弁ではなく議員の発言として扱う", () => {
    const debate = parseMinutes(SAMPLE_DEBATE);
    const member = debate.find((b) => b.speakerType === "memberStatement");
    expect(member?.speakerNumber).toBe("3");
    expect(member?.speakerName).toBe("山本祐平");
    // 委員長報告は役職名なので答弁側に入る
    const chair = debate.find((b) => b.speakerRole === "総務文教委員長");
    expect(chair?.speakerType).toBe("answerer");
  });
});

describe("splitGeneralQuestions", () => {
  const sections = splitGeneralQuestions(parseMinutes(SAMPLE_MINUTES));

  it("議長の終了宣言ごとに1人分へ切り分ける", () => {
    expect(sections).toHaveLength(2);
    expect(sections[0].questionerName).toBe("山本祐平");
    expect(sections[0].questionerNumber).toBe("3");
    expect(sections[1].questionerName).toBe("石田まなみ");
  });

  it("登壇の発言を notice として取り出す", () => {
    expect(sections[0].notice).toContain("①番、昨年８月の大雨災害");
    expect(sections[0].notice).not.toContain("では、①から伺います");
  });

  it("議長の発言はセクションに含めない", () => {
    expect(
      sections[0].speeches.every((s) => s.speakerType !== "chairperson")
    ).toBe(true);
  });

  it("休憩をはさんでも同じ議員の発言は1つのセクションに収まる", () => {
    const names = sections[0].speeches.map((s) => s.speakerName);
    expect(names).toEqual(["山本祐平", "福井崇郎", "山本祐平", "花田積"]);
  });

  it("終了宣言のない日（議案質疑・討論のみ）は1件も返さない", () => {
    const debateDay = `○議長（髙山賢二）　これより質疑に入ります。
◆３番（山本祐平）　議案第９号について質疑いたします。
◎経営企画部長（花田　積）　お答えいたします。
○議長（髙山賢二）　以上で、質疑を終わります。
`;
    expect(splitGeneralQuestions(parseMinutes(debateDay))).toEqual([]);
  });
});

describe("buildTranscript", () => {
  const sections = splitGeneralQuestions(parseMinutes(SAMPLE_MINUTES));

  it("記号つきの発言者行に戻す", () => {
    const text = buildTranscript(sections[0].speeches);
    expect(text).toContain("◆3番（山本祐平）　議席番号３番、山本祐平です。");
    expect(text).toContain("◎市長（福井崇郎）　１項目めの①から");
  });

  it("更質問（登壇のあとのやり取り）を落とさない", () => {
    const text = buildTranscript(sections[0].speeches);
    expect(text).toContain("では、①から伺います。");
    expect(text).toContain("◎経営企画部長（花田積）");
  });

  it("議長の発言は含めない", () => {
    const text = buildTranscript(sections[0].speeches);
    expect(text).not.toContain("議長");
  });
});
