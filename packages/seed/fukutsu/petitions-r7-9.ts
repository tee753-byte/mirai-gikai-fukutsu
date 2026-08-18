/**
 * 令和7年9月定例会に提出された請願のデータ。
 *
 * 請願は市民が議会に提出するもので、議会が受け取るかどうかを議決する（採択／不採択）。
 * 議案とは提出者も議決の言い方も違うが、市民から見れば「議会が何を決めたか」という点で
 * 同じなので、bills テーブルに bill_type = 'petition' として入れる。
 *
 * 出どころ:
 * - 委員長報告・本会議での討論 … 会議録検索システムの会議録
 * - 議決結果 … 市議会ホームページ公開の議決結果PDF（採択／令和7年9月24日）
 *
 * 【重要】請願書そのもの（請願第2号.pdf）は市が公開していない資料なので、
 * 本文・請願人の氏名・住所は一切載せない。ここに載せるのは会議録という、
 * 市が公開している資料に書かれている内容だけ。そのため proposalReason（提案理由）は
 * null にしている（議案と違い、請願には市による提案理由説明が存在しない）。
 *
 * 【データの取り出し方】parse-bill-votes.ts は議長の議決文を区切りにして議案ごとの
 * かたまりを作るが、請願の議決文は議案と書式が違って拾えない。
 *
 *   議案: 「…議案第37号…については、委員会の報告どおり可決することに決定いたしました。」
 *   請願: 「…請願第２号学校給食費の無償化を求める請願は、採択することに決定いたしました。」
 *
 * 「〜について」が無いため MAJORITY_RE にマッチせず、請願第2号の区間が次の議案
 * （議案第37号）のものとして扱われてしまう。その結果こうなっている。
 *
 *   委員長報告 … 議案第40号の末尾に、請願第2号の報告がそのまま続いている
 *   討論       … 議案第37号に、請願第2号の討論5件がまるごと入っている
 *
 * 会議録を確認したところ、議案第37号への討論は1件も無い（「ないようですので、
 * 討論を終結します」）。したがって議案第37号側の討論は全件が請願第2号のものであり、
 * bills-r7-9.ts の sanitizeR7_9Debates で議案側から取り除き、ここで請願側に付け替える。
 */
import type { BillVoteRecord, PlainText } from "./seed-bills-common";

/** 委員長報告が紛れ込んでいる議案 */
const REPORT_HOST = "議案第40号";
/** 本会議の討論が紛れ込んでいる議案 */
const DEBATE_HOST = "議案第37号";

/**
 * 議案側に紛れ込んでいる委員長報告・討論を、請願側のレコードとして組み立て直す。
 * 元データを書き換えず、読み取るだけにしている。
 */
export function buildPetitionsR7_9(
  billVotes: BillVoteRecord[]
): BillVoteRecord[] {
  const find = (billNumber: string) => {
    const found = billVotes.find((v) => v.billNumber === billNumber);
    if (!found) {
      throw new Error(`請願の元になる議案が見つかりません: ${billNumber}`);
    }
    return found;
  };

  const reportHost = find(REPORT_HOST);
  const debateHost = find(DEBATE_HOST);

  // 委員長報告は「請願第○号 ……」の見出し以降が該当部分。
  // 会議録の番号は全角なので、番号は使わず見出しの語で探す
  const report = reportHost.committeeReport ?? "";
  const start = report.indexOf("請願第");

  return [
    {
      billNumber: "請願第2号",
      billName: "学校給食費の無償化を求める請願",
      outcome: "approved",
      voteMethod: "majority",
      sessionDay: debateHost.sessionDay,
      // 議案第37号への討論は会議録上1件も無いため、全件が請願第2号のもの
      debates: debateHost.debates,
      proposalReason: null,
      committeeReport: start >= 0 ? report.slice(start) : null,
      sponsors: [],
      sourceFile: debateHost.sourceFile,
    } as BillVoteRecord,
  ];
}

/**
 * 請願番号ごとの平易な表現。
 * 請願書の本文は非公開資料なので、会議録に出てくる範囲でしか書かない。
 *
 * 【reasonPlain の書き方】
 * 議案の reasonPlain は「市は〜と説明しています」と、提案した側の説明を
 * 書き直したもの。請願にはそれに当たるものが無い（請願書は非公開資料で、
 * 請願人は私人のため）。そこで主語を「請願を審査した委員会は」に統一し、
 * 請願人が何を訴えたかをサイトが代弁する形にはしない。
 */
export const PETITION_PLAIN_TEXTS_R7_9: Record<string, PlainText> = {
  請願第2号: {
    title: "学校給食費を無償にすることを求める（市民からの請願）",
    summary:
      "学校給食費の無償化を求めて市民から提出された請願です。委員会・本会議とも賛成多数で採択されました。本会議では賛成・反対あわせて5人の議員が討論に立ち、必要な財源（年間約4.5億円）をどう確保するかが主な論点になりました。採択された請願は市に送付され、その処理の経過と結果の報告を請求することも決まりました。",
    reasonPlain:
      "請願を審査した総務文教委員会では、無償化した場合の年間費用は実績から約4億5,000万円と想定されることが示されました。財源の確保について、議会としては、行政に対して財源確保を含めて住民の要望を実現するための働きかけを行うこと、中期財政見通しや予算案について財政運営のチェックを行うこと、歳入および歳出の精査・改善を働きかけることが必要である、という認識が示されています。また、アレルギーや宗教的な理由で給食を利用できない児童生徒、不登校の児童生徒への対応についても、他自治体の事例を参考にしながら公平に対応できるよう考えていく、という説明がありました。",
    tag: "子育て・教育",
    committee: "総務文教委員会",
  },
};
