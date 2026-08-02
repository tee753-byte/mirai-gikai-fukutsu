import { describe, expect, it } from "vitest";
import {
  describeVoteMethod,
  extractDebates,
  cutToOwnItem,
  extractProposalReasons,
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

  it("専決処分の承認も案件として拾う", () => {
    // 市長が議会を待たずに決めた事柄を、あとから議会が認めるかどうかの議決。
    // 件名が括弧で終わるので「について」を足さない
    expect(
      splitBillTitle(
        "承認第１号専決処分した事件の承認について（令和７年度福津市一般会計補正予算（専決第２号））"
      )
    ).toEqual({
      billNumber: "承認第1号",
      billName:
        "専決処分した事件の承認について（令和７年度福津市一般会計補正予算（専決第２号））",
    });
  });

  it("決算の認定も案件として拾う", () => {
    expect(
      splitBillTitle("認定第１号令和７年度福津市一般会計歳入歳出決算の認定について")
        ?.billNumber
    ).toBe("認定第1号");
  });

  it("議案でない見出しはnullを返す", () => {
    expect(splitBillTitle("閉会中の所管事務調査")).toBeNull();
  });
});

describe("parseBillVotes（専決処分の承認）", () => {
  // 件名の末尾に括弧が付き、「について」と「は」が離れる書き方
  const TEXT = [
    "○議長（髙山賢二）　これより採決を行います。承認第１号を承認することに賛成の議員の起立を求めます。",
    "○議長（髙山賢二）　賛成多数であります。したがいまして、承認第１号専決処分した事件の承認について（令和７年度福津市一般会計補正予算（専決第２号））は、承認することに決定いたしました。",
  ].join("\n");

  it("括弧で終わる件名でも議決結果を拾う", () => {
    const votes = parseBillVotes(TEXT, 1);

    expect(votes).toHaveLength(1);
    expect(votes[0].billNumber).toBe("承認第1号");
    expect(votes[0].outcome).toBe("approved");
    expect(votes[0].voteMethod).toBe("majority");
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

describe("cutToOwnItem", () => {
  it("次の案件の審査が始まったら、そこで打ち切る", () => {
    // 委員長は付託された案件を続けて読み上げる。切らないと議案第57号のページに
    // 請願第4号の審査内容が出てしまう
    const report = [
      "審査内容。",
      "　（１）主な質疑及び答弁。",
      "　質疑。稼働率はどの程度か。",
      "　（３）審査結果。",
      "　本委員会では、賛成多数により原案のとおり可決すべきものと決定した。",
      "　　　請願第４号　福間南小学校の教育環境整備を求める請願。",
      "　（１）主な質疑及び答弁。",
      "　質疑。請願項目１の文言について見解を伺う。",
    ].join("\n");

    const cut = cutToOwnItem(report);

    expect(cut).toContain("稼働率はどの程度か");
    // 自分の案件の審査結果までは残す
    expect(cut).toContain("可決すべきものと決定した");
    expect(cut).not.toContain("請願第４号");
    expect(cut).not.toContain("福間南小学校");
  });

  it("一括報告の審査結果に並ぶ議案番号では打ち切らない", () => {
    // 予算審査特別委員会は複数の議案をまとめて報告する。
    // 議案番号と議決結果が同じ行にあるものは、次の案件ではなく報告の一部
    const report = [
      "２．審査経過。",
      "　本議案は、全員の議員をもって構成した特別委員会で慎重に審査したため、詳細については省略。",
      "　３．審査結果。",
      "　　　議案第４号　令和７年度一般会計補正予算については、賛成多数により原案のとおり可決すべきものと決定した。",
      "　　　議案第５号　令和７年度国民健康保険事業特別会計補正予算については、賛成多数により原案のとおり可決すべきものと決定した。",
    ].join("\n");

    expect(cutToOwnItem(report)).toBe(report);
  });

  it("先頭がその案件自身の見出しでも空にしない", () => {
    const report = "請願第３号　在自土石流危険区域の被害軽減に関する請願。\n審査内容。";

    expect(cutToOwnItem(report)).toBe(report);
  });
});

describe("extractProposalReasons（発議の読み上げ）", () => {
  it("委員長報告は塊のまま返す（切るのは本文の組み立て時）", () => {
    // 請願は会議録の議決文の書式が議案と違い独立した案件として拾えないため、
    // 直前の議案に紐づいた塊から切り出している。ここで切ると切り出し元が消える
    const text = [
      "◎委員長　議案第57号駐車場の指定管理者を指定することについて。",
      "審査内容。",
      "　（３）審査結果。本委員会では、賛成多数により原案のとおり可決すべきものと決定した。",
      "　　　請願第４号　福間南小学校の教育環境整備を求める請願。",
      "　（１）主な質疑及び答弁。質疑。請願項目１の文言について見解を伺う。",
    ].join("\n");

    const body = extractProposalReasons(text).get("議案第57号") ?? "";

    expect(body).toContain("請願第４号");
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

  it("役職名のあとに読点が入る書き方でも拾う", () => {
    // 令和7年12月定例会 発議第8号の実例。会期によって書き方が揺れる
    const reason =
      "　令和７年12月２日提出。\n" +
      "　提出者、福津市議会議員、中村清隆。賛成者、福津市議会議員、石田まなみ。";

    expect(extractSponsors(reason)).toEqual([
      { role: "proposer", memberName: "中村清隆" },
      { role: "seconder", memberName: "石田まなみ" },
    ]);
  });

  it("提出者の記載が無い議案では空配列", () => {
    expect(extractSponsors("市長の公約に基づき、給料月額を減額するものです。")).toEqual(
      []
    );
  });
});

describe("extractProposalReasons（発議の読み上げ）", () => {
  it("発議の「…について提案いたします。」も見出しとして拾う", () => {
    // 議案は市長が「…についてでございます。」、発議は提出議員が
    // 「…について提案いたします。」と読み上げる
    const text = [
      "○議長（髙山賢二）　日程第９、発議第８号議員報酬に関する条例を改正することについてを議題といたします。",
      "◎１７番（中村清隆）　発議第８号議員報酬に関する条例を改正することについて提案いたします。",
      "　よって、福津市議会会議規則第14条第１項の規定により提出するものです。",
      "　提出者、福津市議会議員、中村清隆。賛成者、福津市議会議員、石田まなみ。",
      "　提案理由としましては、議会広報調査特別委員長に委員長の額を支給することが適当であるためです。",
    ].join("\n");

    const body = extractProposalReasons(text).get("発議第8号") ?? "";

    expect(body).toContain("提出者、福津市議会議員、中村清隆");
    expect(body).toContain("議会広報調査特別委員長に委員長の額を支給");
    // 議長の「…を議題といたします。」は説明ではないので、そこから始まらない
    expect(body).not.toContain("議題といたします");
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
