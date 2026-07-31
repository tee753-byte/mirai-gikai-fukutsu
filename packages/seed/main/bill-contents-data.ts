type DifficultyLevel = "normal" | "hard";

interface BillContentWithBillName {
  bill_name: string;
  difficulty_level: DifficultyLevel;
  title: string;
  summary: string;
  content: string;
}

/**
 * 議案コンテンツ（福津市議会 令和8年6月定例会）
 *
 * 【重要】福津市は議案書そのものを公開していない。
 * そのため、ここに入るのは「件名」と「議決結果」から確実に言えることだけで、
 * 議案書の中身にもとづく要約ではない。AIによる要約でもない。
 * 議案書の提供を受けたあとに、正式な要約へ差し替えること。
 *
 * 出典:
 * - 議案一覧   https://www.city.fukutsu.lg.jp/material/files/group/20/gian080616.pdf
 * - 議決結果   https://www.city.fukutsu.lg.jp/material/files/group/20/giketukekka0806.pdf
 * - 定例会ページ https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19863.html
 */

const SESSION_URL =
  "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19863.html";
const KETSUGI_PDF_URL =
  "https://www.city.fukutsu.lg.jp/material/files/group/20/giketukekka0806.pdf";

type BillOutline = {
  billName: string;
  billNumber: string;
  /** 市民向けの平易な見出し */
  plainTitle: string;
  /** 専門的な見出し（件名をそのまま使う） */
  formalTitle: string;
  result: "可決" | "否決";
  /** 議案の「種類」から言えること。中身の推測は書かない */
  kindNormal: string;
  kindHard: string;
};

const BILL_OUTLINES: BillOutline[] = [
  {
    billName: "令和8年度福津市一般会計補正予算（第1号）について",
    billNumber: "議案第47号",
    plainTitle: "市の予算を年度の途中で組み替える（一般会計の補正予算）",
    formalTitle: "令和8年度福津市一般会計補正予算（第1号）",
    result: "可決",
    kindNormal:
      "市の一年間の使いみちを決めた予算（当初予算）を、年度の途中で変更するための議案です。「一般会計」は、市の基本的な仕事のほとんどを扱う財布のことです。",
    kindHard:
      "地方自治法第218条第1項に基づく補正予算。当初予算成立後に生じた事由により、歳入歳出予算に追加・更正を行うもの。第1号は当該年度で最初の補正を指す。",
  },
  {
    billName: "令和8年度福津市介護保険事業特別会計補正予算（第1号）について",
    billNumber: "議案第48号",
    plainTitle: "介護保険の会計を年度の途中で組み替える（補正予算）",
    formalTitle: "令和8年度福津市介護保険事業特別会計補正予算（第1号）",
    result: "可決",
    kindNormal:
      "介護保険のお金は、市の基本の財布とは分けて管理されています（特別会計）。その予算を年度の途中で変更するための議案です。",
    kindHard:
      "介護保険事業特別会計に係る補正予算。特別会計は特定の事業について歳入歳出を一般会計と区分して経理するもので、介護保険法に基づき市町村が設置する。",
  },
  {
    billName:
      "福津市特別職の職員で常勤のものの給与及び旅費に関する条例を改正することについて",
    billNumber: "議案第49号",
    plainTitle: "市長・副市長などの給与や旅費のきまりを変える（否決）",
    formalTitle:
      "福津市特別職の職員で常勤のものの給与及び旅費に関する条例の改正",
    result: "否決",
    kindNormal:
      "市長や副市長など、常勤の「特別職」と呼ばれる人たちの給与や出張費の決まりを変える議案です。この議案は本会議で否決されました。",
    kindHard:
      "常勤特別職の給与・旅費に関する条例の改正案。特別職の給与は地方自治法第204条等に基づき条例で定めることとされている。本件は本会議において否決された。",
  },
  {
    billName: "福津市税条例を改正することについて",
    billNumber: "議案第50号",
    plainTitle: "市の税金のきまりを変える（市税条例の改正）",
    formalTitle: "福津市税条例の改正",
    result: "可決",
    kindNormal:
      "市が集める税金についての決まりを変える議案です。市税条例は、税の種類や納め方などを定めています。",
    kindHard:
      "市税条例の改正案。地方税法の改正等に伴い、市町村が条例で定める事項を整備する場合に提出されることが多い。",
  },
  {
    billName: "福津市学童保育所条例を改正することについて",
    billNumber: "議案第51号",
    plainTitle: "学童保育所のきまりを変える（学童保育所条例の改正）",
    formalTitle: "福津市学童保育所条例の改正",
    result: "可決",
    kindNormal:
      "放課後に子どもを預かる学童保育所についての決まりを変える議案です。学童保育所の設置や利用に関することを条例で定めています。",
    kindHard:
      "学童保育所（放課後児童健全育成事業）に係る条例の改正案。児童福祉法に基づく事業で、設備・運営の基準は条例で定めることとされている。",
  },
  {
    billName: "財産の取得について",
    billNumber: "議案第52号",
    plainTitle: "市が財産を買うことについて議会の同意を得る",
    formalTitle: "財産の取得",
    result: "可決",
    kindNormal:
      "市が一定額以上の財産を買うときは、市長だけで決めずに議会の議決が必要です。その同意を求める議案です。",
    kindHard:
      "地方自治法第96条第1項第8号および同法施行令に基づき、条例で定める予定価格以上の財産の取得について議会の議決を要するもの。",
  },
  {
    billName: "福津市議会基本条例の制定について",
    billNumber: "発議第2号",
    plainTitle: "議会の役割や運営の基本ルールを新しくつくる",
    formalTitle: "福津市議会基本条例の制定",
    result: "可決",
    kindNormal:
      "議会が自分たちの役割や進め方の基本ルールを定める条例を、新しくつくる議案です。市長ではなく議員が提出しました（発議）。",
    kindHard:
      "議会基本条例の新規制定。議会の役割、議員の責務、市民参加、市長等との関係などを定める議会運営の基本規範。議員提出議案（発議）である。",
  },
  {
    billName: "福津市議会会議規則を改正することについて",
    billNumber: "発議第3号",
    plainTitle: "議会の会議の進め方のきまりを変える",
    formalTitle: "福津市議会会議規則の改正",
    result: "可決",
    kindNormal:
      "議会の会議をどう進めるかを定めた規則を変える議案です。議員が提出しました（発議）。",
    kindHard:
      "地方自治法第120条に基づき議会が定める会議規則の改正。議事手続、発言、表決等の運営細目を定める。議員提出議案（発議）である。",
  },
  {
    billName: "非核三原則の堅持を求める意見書の提出について",
    billNumber: "発議第4号",
    plainTitle: "非核三原則を守るよう国に意見書を出す",
    formalTitle: "非核三原則の堅持を求める意見書の提出",
    result: "可決",
    kindNormal:
      "市議会として国などに意見を伝える「意見書」を出すための議案です。意見書に法的な拘束力はありませんが、議会の意思を示すものです。",
    kindHard:
      "地方自治法第99条に基づく意見書の提出。普通地方公共団体の議会は、当該団体の公益に関する事件について国会または関係行政庁に意見書を提出することができる。",
  },
  {
    billName:
      "ホルムズ海峡情勢の影響から市民生活と地域経済を守るための対策を求める意見書の提出について",
    billNumber: "発議第5号",
    plainTitle: "市民生活と地域経済を守る対策を国に求める意見書を出す",
    formalTitle:
      "ホルムズ海峡情勢の影響から市民生活と地域経済を守るための対策を求める意見書の提出",
    result: "可決",
    kindNormal:
      "市議会として国などに意見を伝える「意見書」を出すための議案です。意見書に法的な拘束力はありませんが、議会の意思を示すものです。",
    kindHard:
      "地方自治法第99条に基づく意見書の提出。普通地方公共団体の議会は、当該団体の公益に関する事件について国会または関係行政庁に意見書を提出することができる。",
  },
  {
    billName:
      "ゆたかな学びの実現・教職員定数改善をはかるための、令和9年度政府予算に係る意見書の提出について",
    billNumber: "発議第6号",
    plainTitle: "教職員の数を増やすことなどを国の予算に求める意見書を出す",
    formalTitle:
      "ゆたかな学びの実現・教職員定数改善をはかるための、令和9年度政府予算に係る意見書の提出",
    result: "可決",
    kindNormal:
      "市議会として国などに意見を伝える「意見書」を出すための議案です。意見書に法的な拘束力はありませんが、議会の意思を示すものです。",
    kindHard:
      "地方自治法第99条に基づく意見書の提出。普通地方公共団体の議会は、当該団体の公益に関する事件について国会または関係行政庁に意見書を提出することができる。",
  },
];

/** 掲載状態の注記。全議案で同じ文面を使う（要約基準を統一するため） */
const NOTICE = `## この記事の情報について

福津市は議案書そのものを公開していません。そのため、このページに掲載しているのは
**議案の件名と議決結果から確実に言えることだけ**です。議案書の中身にもとづく要約ではなく、
AIによる要約でもありません。

議案書の提供を受け次第、内容にもとづく解説に差し替えます。`;

function buildContent(o: BillOutline, level: DifficultyLevel): string {
  const heading = level === "normal" ? o.plainTitle : o.formalTitle;
  const kind = level === "normal" ? o.kindNormal : o.kindHard;

  return `# ${heading}

## 議案の種類

${kind}

## 審議の結果

- 議案番号: ${o.billNumber}
- 議決年月日: 令和8年6月23日
- 議決結果: **${o.result}**

## 元の資料

- [令和8年6月定例会のページ（福津市公式）](${SESSION_URL})
- [議決結果一覧（PDF・福津市公式）](${KETSUGI_PDF_URL})

${NOTICE}`;
}

function buildSummary(o: BillOutline, level: DifficultyLevel): string {
  const kind = level === "normal" ? o.kindNormal : o.kindHard;
  return `${kind}令和8年6月23日の本会議で${o.result}されました。議案書が公開されていないため、内容の要約は掲載していません。`;
}

export const billContentsWithBillName: BillContentWithBillName[] =
  BILL_OUTLINES.flatMap((o) =>
    (["normal", "hard"] as const).map((level) => ({
      bill_name: o.billName,
      difficulty_level: level,
      title: level === "normal" ? o.plainTitle : o.formalTitle,
      summary: buildSummary(o, level),
      content: buildContent(o, level),
    }))
  );

// bill_nameをbill_idに変換する関数
export function createBillContents(
  insertedBills: { id: string; name: string }[]
) {
  return billContentsWithBillName.map((content) => {
    const bill = insertedBills.find((b) => b.name === content.bill_name);
    if (!bill) {
      throw new Error(`Bill not found for content: ${content.bill_name}`);
    }

    return {
      bill_id: bill.id,
      difficulty_level: content.difficulty_level,
      title: content.title,
      summary: content.summary,
      content: content.content,
    };
  });
}
