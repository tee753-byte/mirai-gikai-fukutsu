import type {
  AttendanceCell,
  AttendanceMatrix,
  AttendanceRow,
  AttendanceSession,
} from "@/features/general-questions/shared/utils/build-attendance-matrix";

/**
 * 横幅の確認用の見本データ（開発用ページ専用）。
 *
 * 【なぜ必要か】
 * 星取表は今の任期（令和5年3月定例会〜）を並べる作りにしたが、実データは
 * まだ直近の数回ぶんしか取り込めていない。取り込みを進める前に「任期ぶんの
 * 最大16列が実際どのくらいの横幅になるか」を確かめたいので、列と行だけを
 * 埋めた見本を用意する。
 *
 * 【氏名を架空にしている理由】
 * 実在の議員の氏名に架空の登壇実績を紐づけると、開発用ページとはいえ
 * 事実でない記録を作ることになる。氏名の欄の幅さえ再現できれば目的は足りるため、
 * 実在しない氏名を使う。このファイルは開発用ページからのみ読み込む。
 */

const MOCK_YEARS: { yearLabel: string; months: number[]; year: number }[] = [
  { yearLabel: "令和5年", year: 2023, months: [3, 6, 9, 12] },
  { yearLabel: "令和6年", year: 2024, months: [3, 6, 9, 12] },
  { yearLabel: "令和7年", year: 2025, months: [3, 6, 9, 12] },
  // 令和8年9月・12月はまだ開かれていないが、任期中に必ず開かれる。
  // 最大の16列になっても表が破綻しないかを、ここで先に確かめる。
  { yearLabel: "令和8年", year: 2026, months: [3, 6, 9, 12] },
];

export const MOCK_SESSIONS: AttendanceSession[] = MOCK_YEARS.flatMap((y) =>
  y.months.map((month): AttendanceSession => {
    const slug = `mock-r${y.yearLabel.replace(/[^0-9]/g, "")}-${month}`;
    return {
      slug,
      yearLabel: y.yearLabel,
      monthLabel: `${month}月`,
      fullName: `${y.yearLabel} ${month}月定例会`,
      startDate: `${y.year}-${String(month).padStart(2, "0")}-01`,
    };
  })
);

/** 架空の氏名。実在の議員と同じくらいの文字数にして、氏名の欄の幅を再現する */
const MOCK_MEMBERS: { name: string; party: string }[] = [
  { name: "海野 千尋", party: "無所属" },
  { name: "宮地 岳彦", party: "無所属" },
  { name: "津屋崎 徹", party: "会派あ" },
  { name: "勝浦 美咲", party: "会派あ" },
  { name: "在自 健一郎", party: "会派あ" },
  { name: "神興 佳代", party: "会派あ" },
  { name: "上西郷 実", party: "会派あ" },
  { name: "手光 良夫", party: "会派い" },
  { name: "内殿 春香", party: "会派い" },
  { name: "生家 直人", party: "会派い" },
  { name: "舎利蔵 望", party: "会派い" },
  { name: "本木 隆之", party: "会派う" },
  { name: "畦町 里美", party: "会派う" },
  { name: "八並 誠", party: "会派う" },
  { name: "星ケ丘 洋子", party: "会派え" },
  { name: "日蒔野 学", party: "会派え" },
  { name: "光陽台 三郎", party: "会派え" },
];

/**
 * 見本のマスを決める。
 * 3月は総括質疑、それ以外は一般質問とし、氏名と列の組み合わせから
 * 決まった位置に「登壇なし」を混ぜる（実行のたびに変わらないようにするため）。
 */
function mockCell(memberIndex: number, sessionIndex: number): AttendanceCell {
  const isSokatsu = MOCK_SESSIONS[sessionIndex].monthLabel === "3月";
  const skip = (memberIndex * 7 + sessionIndex * 3) % 11 === 0;
  if (skip) return "none";
  return isSokatsu ? "sokatsu" : "general";
}

export const MOCK_MATRIX: AttendanceMatrix = {
  sessions: MOCK_SESSIONS,
  rows: MOCK_MEMBERS.map((member, memberIndex): AttendanceRow => {
    const slug = member.name.replace(/\s/g, "");

    // 最後の1人は議長役。制度上のマス（×）の見え方を確認するため
    const isChair = memberIndex === MOCK_MEMBERS.length - 1;
    // 「星ケ丘 洋子」は任期途中で退任した役。在任期間外のマスを確認するため
    const isFormer = member.name === "星ケ丘 洋子";
    const leftOnIndex = 5; // 令和6年6月定例会の後に退任した想定

    const cells = MOCK_SESSIONS.map((_, sessionIndex): AttendanceCell => {
      if (isFormer && sessionIndex > leftOnIndex) return "not_in_office";
      if (isChair) return "chair";
      return mockCell(memberIndex, sessionIndex);
    });

    return {
      slug,
      name: member.name,
      party: member.party,
      isChair,
      leftOnLabel: isFormer ? "令和6年6月" : null,
      cells,
    };
  }),
};
