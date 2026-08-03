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
 * 出どころ:
 * - 議案の件名・議決結果 … 福津市が公開している議案一覧PDF・議決結果PDF
 * - 議案書に印刷されている「理由」 … 市議会から提供を受けた議案書PDF
 *   （fukutsu/build-bill-documents.ts で data/r8-6-bill-documents.json に書き出したもの）
 * - やさしいタイトルと説明 … 上記をもとにAIが平易に書き直したもの
 *
 * 議案書PDFそのものは再配布の可否が未確認のため、リポジトリにもサイトにも載せない。
 * 引用しているのは理由文だけ。
 *
 * 【まだ入っていないもの】6月定例会は会議録が未公開のため、本会議での質疑・討論と、
 * 議員別の賛否が入っていない。fukutsu/bills-r8-3.ts と同じ手順で、
 * 会議録（令和8年9月ごろ公開見込み）と市議会だより夏号が出たら差し替えること。
 *
 * 出典:
 * - 議案一覧   https://www.city.fukutsu.lg.jp/material/files/group/20/gian080616.pdf
 * - 議決結果   https://www.city.fukutsu.lg.jp/material/files/group/20/giketukekka0806.pdf
 * - 定例会ページ https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19863.html
 */
import {
  buildHardContent,
  buildNormalContent,
} from "../fukutsu/bill-content-format";
import {
  loadBillDocuments,
  toReasonMap,
} from "../fukutsu/load-bill-documents";
import {
  budgetSystemNote,
  contractSystemNote,
} from "../fukutsu/seed-bills-common";

/**
 * 議案書に印刷されている理由。
 *
 * 予算議案（議案第47・48号）と財産の取得（議案第52号）は、制度上そもそも
 * 理由欄が無いため null になる。
 *
 * 意見書の発議（発議第4〜6号）は、以前ここも null だった。議案書の解析が
 * 行頭の「理 由」しか探しておらず、意見書の別冊PDFに書かれた「提案理由」を
 * 取りこぼしていたためで、資料に無かったわけではない。現在は発議第4号・
 * 第6号の理由が入る（発議第5号は議案書にも提案理由の記載が無い）。
 */
const DOCUMENT_REASONS = toReasonMap(
  loadBillDocuments("r8-6-bill-documents.json")
);

const SESSION_URL =
  "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19863.html";
const KETSUGI_PDF_URL =
  "https://www.city.fukutsu.lg.jp/material/files/group/20/giketukekka0806.pdf";

/**
 * この会期の議決日。会期を変えるときはここだけ直せば、
 * 記事中の議決年月日も、注記に出す会議録の公開見込みも追従する。
 */
const DECIDED_AT = "2026-06-23";

/** 西暦の年を令和に直す。2019年が令和元年 */
function toWareki(year: number): number {
  return year - 2018;
}

const [DECIDED_YEAR, DECIDED_MONTH, DECIDED_DAY] = DECIDED_AT.split("-").map(
  Number
);

/** 記事に出す議決年月日。例「令和8年6月23日」 */
const DECIDED_LABEL = `令和${toWareki(DECIDED_YEAR)}年${DECIDED_MONTH}月${DECIDED_DAY}日`;

/**
 * 会議録の公開見込み。福津市議会の会議録は正式公開までおよそ3か月かかるため、
 * 議決日から機械的に出す。会期ごとに手で書き換えないこと。
 */
const MINUTES_DUE_LABEL = (() => {
  const months = DECIDED_YEAR * 12 + (DECIDED_MONTH - 1) + 3;
  const year = Math.floor(months / 12);
  const month = (months % 12) + 1;
  return `令和${toWareki(year)}年${month}月ごろ`;
})();

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
  /**
   * やさしい版の「なぜ出されたのか」に載せる本文。
   * 議案書に印刷された理由を平易に書き直したもので、原文ではない。
   * 理由欄が無い議案（予算・財産の取得・意見書）は省略する。
   */
  reasonPlain?: string;
  /**
   * 理由の記録が無い議案（予算）に置く、しくみの説明。
   * 誰かの説明ではなく制度そのものの説明なので、reasonPlain とは別にする。
   */
  systemNote?: string;
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
    systemNote: budgetSystemNote({
      kind: "補正予算",
      account: "市全体のお金（一般会計）",
    }),
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
    systemNote: budgetSystemNote({
      kind: "補正予算",
      account: "介護保険のお金（特別会計）",
    }),
    kindHard:
      "介護保険事業特別会計に係る補正予算。特別会計は特定の事業について歳入歳出を一般会計と区分して経理するもので、介護保険法に基づき市町村が設置する。",
  },
  {
    billName:
      "福津市特別職の職員で常勤のものの給与及び旅費に関する条例を改正することについて",
    billNumber: "議案第49号",
    plainTitle: "市長の給料を公約にもとづいて減らす（否決）",
    formalTitle:
      "福津市特別職の職員で常勤のものの給与及び旅費に関する条例の改正",
    result: "否決",
    kindNormal:
      "市長や副市長など常勤の「特別職」の給与を定めた条例を改正する議案です。今回減額の対象になるのは市長です。",
    reasonPlain:
      "市長は、自身の公約にもとづいて、令和8年7月1日から任期が終わるまでのあいだ、市長の給料の月額と、期末手当（ボーナス）を計算するもとになる給料月額を減らす措置をとるため、条例を直すと説明しています。",
    kindHard:
      "常勤特別職の給与・旅費に関する条例の改正案。特別職の給与は地方自治法第204条第3項に基づき条例で定めることとされている。本件は市長の給料月額および期末手当の算定基礎となる給料月額について、令和8年7月1日から任期満了までの減額措置を講ずるもの。",
  },
  {
    billName: "福津市税条例を改正することについて",
    billNumber: "議案第50号",
    plainTitle: "国の地方税法の改正に合わせて市税のきまりを直す",
    formalTitle: "福津市税条例の改正",
    result: "可決",
    kindNormal:
      "市の税金の決まり（市税条例）を直すための議案です。市税条例は、税の種類や納め方などを定めています。",
    reasonPlain:
      "市は、国の「地方税法等の一部を改正する法律」（令和8年法律第2号）が公布されたことに伴い、関係する市税条例を直す必要があると説明しています。",
    kindHard:
      "市税条例の改正案。地方税法等の一部を改正する法律（令和8年法律第2号）の公布に伴い、市町村が条例で定める事項について所要の整備を行うもの。",
  },
  {
    billName: "福津市学童保育所条例を改正することについて",
    billNumber: "議案第51号",
    plainTitle: "新設小学校の学童保育所を令和9年4月に開くためにきまりを直す",
    formalTitle: "福津市学童保育所条例の改正",
    result: "可決",
    kindNormal:
      "放課後に子どもを預かる学童保育所の決まりを直すための議案です。学童保育所の設置や利用に関することを条例で定めています。",
    reasonPlain:
      "市は、新しく建てる小学校の学童保育所を令和9年4月1日から開くことに伴い、市の学童保育所条例を直す必要があると説明しています。",
    kindHard:
      "学童保育所（放課後児童健全育成事業）に係る条例の改正案。児童福祉法に基づく事業で、設備・運営の基準は条例で定めることとされている。本件は新設小学校学童保育所の令和9年4月1日開所に伴う所要の改正。",
  },
  {
    billName: "財産の取得について",
    billNumber: "議案第52号",
    plainTitle: "消防ポンプ自動車を1台買う（2,314万9,960円）",
    formalTitle: "財産の取得",
    result: "可決",
    kindNormal:
      "市が消防ポンプ自動車を1台買うことについて、議会の同意を求める議案です。取得価格は2,314万9,960円、納入期限は令和9年2月26日。指名競争入札により、愛知ポンプ工業株式会社（福岡市中央区）から取得します。",
    systemNote: contractSystemNote({ hasMinutes: false }),
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
      "議会の運営の基本となる決まりを新しくつくる議案です。市長ではなく議員が提出しました（発議）。",
    reasonPlain:
      "提出した議員は、市長と議会をそれぞれ市民が選ぶ二元代表制のもとで、議会と議員の役割・責務に加えて、議会と市長、議会と市民の関係をはっきりさせることにより、市民に身近で開かれた議会をめざすとしています。そのうえで、市民の付託に的確に応え、市民福祉の向上と公正で民主的な市政の発展に寄与することを目的に、この条例をつくるとしています。",
    kindHard:
      "議会基本条例の新規制定。二元代表制のもとで議会・議員の役割と責務、議会と市長等および市民との関係を定める議会運営の基本規範。議員提出議案（発議）である。",
  },
  {
    billName: "福津市議会会議規則を改正することについて",
    billNumber: "発議第3号",
    plainTitle: "議会基本条例をつくったことに伴い会議の進め方のきまりを直す",
    formalTitle: "福津市議会会議規則の改正",
    result: "可決",
    kindNormal:
      "議会の会議をどう進めるかを定めた規則を直す議案です。議員が提出しました（発議）。",
    reasonPlain:
      "提出した議員は、同じ定例会で福津市議会基本条例（発議第2号）をつくったことに伴い、議会の会議規則を直す必要が生じたと説明しています。",
    kindHard:
      "地方自治法第120条に基づき議会が定める会議規則の改正。議事手続、発言、表決等の運営細目を定める。本件は福津市議会基本条例の制定に伴う所要の改正で、議員提出議案（発議）である。",
  },
  {
    billName: "非核三原則の堅持を求める意見書の提出について",
    billNumber: "発議第4号",
    plainTitle: "非核三原則を守るよう国に意見書を出す",
    formalTitle: "非核三原則の堅持を求める意見書の提出",
    result: "可決",
    kindNormal:
      "「核兵器を持たず、作らず、持ち込ませず」という非核三原則を今後も守るよう、国に求める意見書を出す議案です。市議会として国などに意見を伝えるもので、法的な拘束力はありませんが、議会の意思を示すものです。",
    reasonPlain:
      "提出した議員は、日本が世界で唯一の戦争被爆国として、核兵器の脅威と被爆の実相を全世界に伝え、恒久平和の実現に向けて世界の範となり、非核三原則を堅持するよう国に要望するとしています。",
    kindHard:
      "地方自治法第99条に基づく意見書の提出。普通地方公共団体の議会は、当該団体の公益に関する事件について国会または関係行政庁に意見書を提出することができる。",
  },
  {
    billName:
      "ホルムズ海峡情勢の影響から市民生活と地域経済を守るための対策を求める意見書の提出について",
    billNumber: "発議第5号",
    plainTitle: "石油の値上がりから暮らしと地域経済を守るよう国に意見書を出す",
    formalTitle:
      "ホルムズ海峡情勢の影響から市民生活と地域経済を守るための対策を求める意見書の提出",
    result: "可決",
    kindNormal:
      "中東情勢の緊迫化による石油関連の資材不足・価格高騰から、市民の暮らしと地域経済を守る対策を国に求める意見書を出す議案です。市議会として国などに意見を伝えるもので、法的な拘束力はありませんが、議会の意思を示すものです。",
    // この発議の議案書には「理由」欄が無く、意見書（案）の本文だけが載っている。
    // 何を国に求めたのかは市民に関わるので、その本文から書き起こす。
    reasonPlain:
      "提出した議員は、中東情勢の緊迫化でホルムズ海峡周辺の混乱が続き、国内の医療・介護、中小企業、農業といった暮らしと地域経済を支える現場に深刻な影響が出ていると述べています。中小企業からは石油由来資材の欠品や価格高騰で仕事の依頼に応えられないという声が、農業の現場からは肥料や農業用ビニールの欠品・値上げで営農計画の見通しが立たないという声が、医療機関からは手術用手袋や透析回路などの資材が数日分しか確保できないという声が出ている、としています。\n\nそのうえで国に対し、次の5点を求めています。\n\n1. 中小企業への直接支援（資材の供給確保と価格高騰への支援、税や社会保険料の納付猶予・減免）\n2. 農業を続けるための緊急対策（燃油・肥料・農業用ビニールの高騰への支援）\n3. 赤字企業でも使える賃上げ支援制度の創設\n4. 医療・介護の資材の安定供給と、資材高騰分・光熱費の負担増への緊急支援\n5. 米国とイラン双方への停戦の働きかけなど、外交による情勢の安定化",
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
      "教職員の数を増やすことなど、学校の体制の充実を令和9年度の国の予算に反映するよう求める意見書を出す議案です。市議会として国などに意見を伝えるもので、法的な拘束力はありませんが、議会の意思を示すものです。",
    reasonPlain:
      "提出した議員は、子どもたちのゆたかな学びを保障し、教職員の体制の充実と教育環境の向上をはかるため、国に意見書を出すとしています。",
    kindHard:
      "地方自治法第99条に基づく意見書の提出。普通地方公共団体の議会は、当該団体の公益に関する事件について国会または関係行政庁に意見書を提出することができる。",
  },
];

/**
 * 本文の組み立てに渡す前提。
 *
 * 他の会期と同じ形で読めるように、共通の bill-content-format を使う。
 * この会期は会議録も市議会だよりも未公開なので、質疑・討論と議員別の賛否が
 * まだ載せられないことを記事に明記する。
 */
function toContentInput(o: BillOutline) {
  return {
    subject: "議案",
    billName: o.billName,
    reasonPlain: o.reasonPlain,
    systemNote: o.systemNote,
    // 提案理由を説明したのが市か提出議員かで見出しの主語が変わる
    isMemberBill: o.billNumber.startsWith("発議"),
    documentReason: DOCUMENT_REASONS.get(o.billNumber) ?? null,
    proposalReason: null,
    committeeReport: null,
    sources: [
      { label: "令和8年6月定例会のページ（福津市公式）", url: SESSION_URL },
      { label: "議決結果一覧（PDF・福津市公式）", url: KETSUGI_PDF_URL },
    ],
    hasMinutes: false,
    hasMemberVotes: false,
    minutesDueLabel: MINUTES_DUE_LABEL,
    aiSourceLabel:
      "福津市が公開している議案一覧・議決結果一覧と、議案書に記載された「理由」",
    originalDocumentNote:
      "ここに載せているのは、議案書に記載された内容と議決結果です。議案書そのものは、この非公式サイトでは再掲載していません。",
  };
}

function buildContent(o: BillOutline, level: DifficultyLevel): string {
  const input = toContentInput(o);
  // やさしい版には「なぜ出されたのか」として平易に書き直したものを置き、
  // 議案書の理由の原文はくわしい版だけに引用する。
  // documentReason はやさしい版でも渡す（原文がどこで読めるかの案内に使う）
  return level === "normal"
    ? buildNormalContent(input)
    : buildHardContent(input);
}

/**
 * カードとページ上部に出す要約。
 *
 * 議決の結果は審議のステータスカードに出るので、ここには書かない。
 * 他の会期の要約とも書き方をそろえる。
 */
function buildSummary(o: BillOutline, level: DifficultyLevel): string {
  return level === "normal" ? o.kindNormal : o.kindHard;
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
