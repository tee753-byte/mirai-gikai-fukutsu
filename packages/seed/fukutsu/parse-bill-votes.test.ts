import { describe, expect, it } from "vitest";
import {
  describeVoteMethod,
  extractDebates,
  extractSponsors,
  parseBillVotes,
  splitBillTitle,
  toHalfWidthDigits,
} from "./parse-bill-votes";

/**
 * 令和8年3月定例会の最終日（2026-03-26）の書式をそのまま縮めたサンプル。
 * 実ファイルは C:/Users/Work/Desktop/AIwork/会議録/ に置いている
 * （著作権の扱いが未確認のためリポジトリには入れない）。
 */
const SAMPLE = `　日程第10、議案第19号福津市武道館条例を改正することについての討論を受けます。討論ございませんか。
　　　　　　　　　　　　〔議員の挙手あり〕
○議長（髙山賢二）　まず、本案に反対の議員の発言を許します。４番、岩下議員。
◎４番（岩下　豊）　議案第19号について。受益者負担の考え方には賛成できないため、反対といたします。
○議長（髙山賢二）　次に、賛成の議員の発言を許します。15番、榎本議員。
◎１５番（榎本　博）　反対の立場から討論いたします。本議案を含め……。
○議長（髙山賢二）　榎本議員、賛成の議員の発言を許しております。（発言の声あり）榎本議員。
◎１５番（榎本　博）　大変申し訳ありません。賛成の立場で討論いたします。使用料の算定方法の統一を図るものであり、妥当性があると評価し、賛成の立場で討論いたします。
○議長（髙山賢二）　次に、反対の議員の発言を許します。
　　　　　　　　　　　　〔「なし」の声あり〕
○議長（髙山賢二）　討論を終結します。
　これより採決を行います。委員会の報告どおり決定することに賛成の議員の起立を求めます。
　　　　　　　　　　　　〔起　　立〕
○議長（髙山賢二）　賛成少数であります。したがいまして、議案第19号福津市武道館条例を改正することについては、否決することに決定いたしました。
　日程第11、議案第20号福津市体育施設条例を改正することについての討論を受けます。討論ございませんか。
　　　　　　　　　　　　〔「なし」の声あり〕
○議長（髙山賢二）　ないようですので、討論を終結します。
　これより採決を行います。委員会の報告どおり決定することに賛成の議員の起立を求めます。
　　　　　　　　　　　　〔起　　立〕
○議長（髙山賢二）　賛成多数であります。したがいまして、議案第20号福津市体育施設条例を改正することについては、委員会の報告どおり可決することに決定いたしました。
　日程第25、議案第33号福津市下水道条例を改正することについての討論を受けます。
○議長（髙山賢二）　討論を終結します。
　これより採決を行います。
　　　　　　　　　　　　〔起　　立〕
○議長（髙山賢二）　可否同数であります。よって、地方自治法第116条第１項の規定により、議長により本案に対する可否を裁決します。議案第33号福津市下水道条例を改正することについては、議長は否決と裁決します。したがいまして、日程第25、議案第33号福津市下水道条例を改正することについては否決されました。
`;

describe("toHalfWidthDigits", () => {
  it("全角数字を半角に直す", () => {
    expect(toHalfWidthDigits("議案第１９号")).toBe("議案第19号");
  });
});

describe("splitBillTitle", () => {
  it("議案番号と件名に割る", () => {
    expect(splitBillTitle("議案第33号福津市下水道条例を改正すること")).toEqual({
      billNumber: "議案第33号",
      billName: "福津市下水道条例を改正することについて",
    });
  });

  it("全角の議案番号も半角に揃える", () => {
    expect(splitBillTitle("発議第１号基金運用に関する決議の提出")?.billNumber).toBe(
      "発議第1号"
    );
  });

  it("「について」が既にあれば足さない", () => {
    expect(splitBillTitle("議案第45号市道路線の認定について")?.billName).toBe(
      "市道路線の認定について"
    );
  });

  it("議案でない見出しはnullを返す", () => {
    expect(splitBillTitle("閉会中の所管事務調査")).toBeNull();
  });
});

describe("parseBillVotes", () => {
  const votes = parseBillVotes(SAMPLE, 8);

  it("議決された議案をすべて拾う", () => {
    expect(votes.map((v) => v.billNumber)).toEqual([
      "議案第19号",
      "議案第20号",
      "議案第33号",
    ]);
  });

  it("賛成少数は否決として扱う", () => {
    const v = votes[0];
    expect(v.outcome).toBe("rejected");
    expect(v.voteMethod).toBe("minority");
  });

  it("賛成多数は可決として扱う", () => {
    expect(votes[1].outcome).toBe("approved");
    expect(votes[1].voteMethod).toBe("majority");
  });

  it("可否同数の議長裁決を拾う", () => {
    expect(votes[2].outcome).toBe("rejected");
    expect(votes[2].voteMethod).toBe("chairDecision");
  });

  it("討論が無い議案は空配列になる", () => {
    expect(votes[1].debates).toEqual([]);
  });

  it("会議録の何日目から取ったかを持つ", () => {
    expect(votes[0].sessionDay).toBe(8);
  });
});

describe("extractDebates", () => {
  const debates = extractDebates(SAMPLE.slice(0, SAMPLE.indexOf("賛成少数")));

  it("議長が指定した立場で賛成討論・反対討論を振り分ける", () => {
    expect(debates).toHaveLength(2);
    expect(debates[0].stance).toBe("against");
    expect(debates[0].speakerName).toBe("岩下豊");
    expect(debates[0].speakerNumber).toBe("4");
    expect(debates[1].stance).toBe("for");
    expect(debates[1].speakerName).toBe("榎本博");
  });

  it("立場を言い間違えて議長に制止された場合、言い直した発言を採る", () => {
    // 令和8年3月定例会 議案第19号の実例。短い方（言い間違い）を拾ってはいけない
    expect(debates[1].rawText).toContain("大変申し訳ありません");
    expect(debates[1].rawText).toContain("賛成の立場で討論いたします");
  });

  it("〔「なし」の声あり〕だけの区間は討論として数えない", () => {
    const none = extractDebates(
      "○議長（髙山賢二）　まず、本案に反対の議員の発言を許します。\n〔「なし」の声あり〕\n○議長（髙山賢二）　討論を終結します。"
    );
    expect(none).toEqual([]);
  });

  it("委員会の報告が否決のときの前置き付きでも立場を拾える", () => {
    const d = extractDebates(
      "○議長（髙山賢二）　まず、委員会の報告は否決ですので、本案に賛成の議員の発言を許します。15番、榎本議員。\n◎１５番（榎本　博）　賛成の立場で討論いたします。\n○議長（髙山賢二）　討論を終結します。"
    );
    expect(d).toHaveLength(1);
    expect(d[0].stance).toBe("for");
  });
});

describe("extractSponsors", () => {
  it("提出者と賛成者を読み上げから拾う", () => {
    const reason =
      "上記の議案を、福津市議会会議規則第14条第１項の規定により、次のとおり提出いたします。\n" +
      "　令和８年３月12日、福津市議会議長髙山賢二様。\n" +
      "　提出者、福津市議会議員山本祐平、賛成者、福津市議会議員石田まなみ。";

    expect(extractSponsors(reason)).toEqual([
      { role: "proposer", memberName: "山本祐平" },
      { role: "seconder", memberName: "石田まなみ" },
    ]);
  });

  it("賛成者が複数でも拾う", () => {
    const reason = "提出者、福津市議会議員山本祐平、賛成者、福津市議会議員石田まなみ、福津市議会議員岩下豊。";

    expect(extractSponsors(reason).filter((s) => s.role === "seconder")).toEqual([
      { role: "seconder", memberName: "石田まなみ" },
      { role: "seconder", memberName: "岩下豊" },
    ]);
  });

  it("提出者の記載が無い議案では空配列", () => {
    expect(extractSponsors("市長の公約に基づき、給料月額を減額するものです。")).toEqual(
      []
    );
  });
});

describe("describeVoteMethod", () => {
  it("採決のとり方を市民向けの一文にする", () => {
    expect(describeVoteMethod("majority")).toBe("起立採決（賛成多数）");
    expect(describeVoteMethod("chairDecision")).toBe(
      "起立採決で可否同数となり、議長が裁決"
    );
  });
});
