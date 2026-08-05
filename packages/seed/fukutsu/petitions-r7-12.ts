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
 *
 * 【reasonPlain の書き方】
 * 議案の reasonPlain は「市は〜と説明しています」と、提案した側の説明を
 * 書き直したもの。請願にはそれに当たるものが無い。請願書は非公開資料で、
 * 請願人は私人だからである。
 *
 * そこで請願では、市が公開している会議録の委員長報告だけを材料にし、
 * 主語を「請願を審査した委員会は」に統一する。請願人が何を訴えたかを
 * サイトが代弁する形にはしない。委員会の質疑で請願の趣旨に触れている
 * 部分があれば、「〜という説明があった」と委員会でのやり取りとして書く。
 */
export const PETITION_PLAIN_TEXTS_R7_12: Record<string, PlainText> = {
  請願第3号: {
    title: "在自地区の土石流被害を減らす対策を求める（市民からの請願）",
    summary:
      "在自地区の土石流危険区域について、被害を軽減する対策を求めて市民から提出された請願です。委員会・本会議とも賛成多数で採択され、関係機関への送付と処理経過の報告を請求することも決まりました。",
    reasonPlain:
      "請願を審査した建設環境委員会では、この地区が土石流の土砂災害特別警戒区域に指定されていること、令和7年8月の豪雨では甚大な被害には至らなかったものの、今後早急な対応が必要であることを理由に、賛成の意見が出されました。請願は4つの項目からなり、4つ目の「安全・安心地域の創生」については、1つ目から3つ目への対応が難しい場合に何らかの代替案を示してほしいという思いが込められている、という説明が委員会でありました。",
    tag: "防災",
    committee: "建設環境委員会",
  },
  請願第4号: {
    title: "福間南小学校の教育環境の整備を求める（市民からの請願）",
    summary:
      "福間南小学校の教育環境の整備を求めて市民から提出された請願です。請願項目は4つあり、うち「過大規模校の解消に進むか否かの方針決定を今年度中に行うこと」という項目について、『解消に進まない』という選択肢を認めることになるという反対意見が出ました。委員会・本会議とも賛成少数で不採択となりました。",
    reasonPlain:
      "請願を審査した総務文教委員会では、1つ目の項目にある「過大規模校の解消に進むか否かの方針決定を今年度中に行うこと」という書き方が論点になりました。委員会では、曖昧な状況が続くことへの不安から方向性をはっきり示してほしいという保護者の声を受けた表現である、という説明がありました。一方で、この書き方は「解消に進まない」という選択肢を行政に与えることになる、という反対の意見が出され、賛成少数で不採択とすべきものと決定されました。",
    tag: "子育て・教育",
    committee: "総務文教委員会",
  },
};
