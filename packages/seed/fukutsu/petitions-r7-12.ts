/**
 * 令和7年12月定例会に提出された請願のデータ。
 *
 * 請願は市民が議会に提出するもので、議会が受け取るかどうかを議決する（採択／不採択）。
 * 議案とは提出者も議決の言い方も違うが、市民から見れば「議会が何を決めたか」という点で
 * 同じなので、bills テーブルに bill_type = 'petition' として入れる。
 *
 * 出どころ:
 * - 委員長報告 … 会議録検索システムの会議録
 * - 本会議での討論 … 同上
 * - 議決結果と議員別の賛否 … 福津市議会だより84号の賛否表（seed-member-votes-r7-12.ts）
 *
 * 【重要】請願書そのもの（請願第3号.pdf・請願第4号.pdf）は市が公開していない
 * 資料なので、本文・請願人の氏名・住所は一切載せない。ここに載せるのは
 * 会議録と議会だよりという、市が公開している資料に書かれている内容だけ。
 * そのため proposalReason（提案理由）は null にしている（議案と違い、請願には
 * 市による提案理由説明が存在しない）。
 *
 * 【データの取り出し方】会議録上、請願は議案の直後に審査されたため、
 * parse-bill-votes.ts が請願の内容を直前の議案に紐づけてしまっている。
 * ややこしいことに、委員長報告と本会議の討論では紛れ込んだ先が違う。
 *
 *   請願第3号 … 委員長報告は議案第57号に、討論は発議第8号に混入
 *   請願第4号 … 委員長報告は議案第54号に、討論は議案第55号に混入
 *
 * bills-r7-12.ts の sanitizeR7_12Debates が議案側（議案第55号・発議第8号）から
 * 取り除いた討論を、ここで請願側に付け替える。
 */
import type { BillVoteRecord, PlainText } from "./seed-bills-common";

type PetitionMeta = {
  billNumber: string;
  billName: string;
  /** "approved" は採択、"rejected" は不採択として扱う */
  outcome: "approved" | "rejected";
  voteMethod: "majority" | "minority";
  /** 委員長報告が紛れ込んでいる議案 */
  reportHost: string;
  /** 本会議の討論が紛れ込んでいる議案 */
  debateHost: string;
};

const PETITION_META: PetitionMeta[] = [
  {
    billNumber: "請願第3号",
    billName: "在自土石流危険区域の被害軽減に関する請願",
    outcome: "approved",
    voteMethod: "majority",
    reportHost: "議案第57号",
    debateHost: "発議第8号",
  },
  {
    billNumber: "請願第4号",
    billName: "福間南小学校の教育環境整備を求める請願",
    outcome: "rejected",
    voteMethod: "minority",
    reportHost: "議案第54号",
    debateHost: "議案第55号",
  },
];

/**
 * 議案側に紛れ込んでいる委員長報告・討論を、請願側のレコードとして組み立て直す。
 * 元データを書き換えず、読み取るだけにしている。
 */
export function buildPetitionsR7_12(
  billVotes: BillVoteRecord[]
): BillVoteRecord[] {
  const find = (billNumber: string) => {
    const found = billVotes.find((v) => v.billNumber === billNumber);
    if (!found) {
      throw new Error(`請願の元になる議案が見つかりません: ${billNumber}`);
    }
    return found;
  };

  return PETITION_META.map((meta) => {
    const reportHost = find(meta.reportHost);
    const debateHost = find(meta.debateHost);

    // 委員長報告は「請願第○号 ……」の見出し以降が該当部分。
    // 会議録の番号は全角なので、番号は使わず見出しの語で探す
    const report = reportHost.committeeReport ?? "";
    const start = report.indexOf("請願第");

    return {
      billNumber: meta.billNumber,
      billName: meta.billName,
      outcome: meta.outcome,
      voteMethod: meta.voteMethod,
      sessionDay: reportHost.sessionDay,
      // 議案そのものへの討論は請願に触れない。請願に触れている発言だけが請願への討論
      debates: debateHost.debates.filter((d) => d.rawText.includes("請願")),
      proposalReason: null,
      committeeReport: start >= 0 ? report.slice(start) : null,
      sponsors: [],
      sourceFile: reportHost.sourceFile,
    } as BillVoteRecord;
  });
}

/**
 * 請願番号ごとの平易な表現。
 * 請願書の本文は非公開資料なので、会議録に出てくる範囲でしか書かない。
 */
export const PETITION_PLAIN_TEXTS_R7_12: Record<string, PlainText> = {
  請願第3号: {
    title: "在自地区の土石流被害を減らす対策を求める（市民からの請願）",
    summary:
      "在自地区の土石流危険区域について、被害を軽減する対策を求めて市民から提出された請願です。委員会・本会議とも賛成多数で採択され、関係機関への送付と処理経過の報告を請求することも決まりました。",
    tag: "くらし・まちづくり",
    committee: "建設環境委員会",
  },
  請願第4号: {
    title: "福間南小学校の教育環境の整備を求める（市民からの請願）",
    summary:
      "福間南小学校の教育環境の整備を求めて市民から提出された請願です。請願項目は4つあり、うち「過大規模校の解消に進むか否かの方針決定を今年度中に行うこと」という項目について、『解消に進まない』という選択肢を認めることになるという反対意見が出ました。委員会・本会議とも賛成少数で不採択となりました。",
    tag: "子育て・教育",
    committee: "総務文教委員会",
  },
};
