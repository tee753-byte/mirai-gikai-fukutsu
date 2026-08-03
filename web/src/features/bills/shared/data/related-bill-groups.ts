/**
 * 相互にリンクする議案のまとまり。
 *
 * 【なぜ手で決めているか】
 * はじめは「件名が同じなら同じ案件の再提出」と機械的に判定していた。
 * ところが福津市議会には、件名が一字一句同じなのに改正の向きが逆、という
 * 組み合わせが実在する。
 *
 *   令和7年12月 議案第45号 … 特別職の期末手当を引き上げる（可決）
 *   令和8年3月  議案第16号 … 市長の給料を減らす（否決）
 *   令和8年6月  議案第49号 … 市長の給料を減らす（否決）
 *
 * どれも件名は「福津市特別職の職員で常勤のものの給与及び旅費に関する条例を
 * 改正することについて」で、条例の名前しか書かれていないため、件名からは
 * 上げるのか下げるのかが分からない。3件を並べると「同じ議案が1回通って
 * 2回落ちた」と読めてしまう。
 *
 * 何と何が同じ話なのかは資料を読んだ人間にしか判断できないので、ここに
 * 明示的に書く。自動で増えないぶん、誤ったリンクも生まれない。
 *
 * 【足すときの注意】
 * 「議決の結果が違う議案を並べる」こと自体が読み手への含みになる。
 * 同じ内容の議案が出し直されたときだけ足し、賛否の評価は書かない。
 */

/** 会期のslugと議案番号で1件を指す */
export type RelatedBillRef = {
  sessionSlug: string;
  billNumber: string;
};

export type RelatedBillGroup = {
  /** 何がつながっているのかを一言で。節の説明文に出す */
  description: string;
  bills: RelatedBillRef[];
};

export const RELATED_BILL_GROUPS: RelatedBillGroup[] = [
  {
    description:
      "市長の給料を減らす条例の改正は、令和8年3月定例会と6月定例会の2回提出されています。",
    bills: [
      { sessionSlug: "r8-3", billNumber: "議案第16号" },
      { sessionSlug: "r8-6", billNumber: "議案第49号" },
    ],
  },
];

/** 同じ議案を指しているか */
function isSameBill(a: RelatedBillRef, b: RelatedBillRef): boolean {
  return a.sessionSlug === b.sessionSlug && a.billNumber === b.billNumber;
}

/**
 * 指定した議案が属するグループを返す。属していなければ null。
 * ひとつの議案が複数のグループに入ることは想定していないので、最初の1件を返す。
 */
export function findRelatedBillGroup(
  ref: RelatedBillRef
): RelatedBillGroup | null {
  return (
    RELATED_BILL_GROUPS.find((group) =>
      group.bills.some((b) => isSameBill(b, ref))
    ) ?? null
  );
}

/** グループのうち、自分以外の議案を返す */
export function othersInGroup(
  group: RelatedBillGroup,
  self: RelatedBillRef
): RelatedBillRef[] {
  return group.bills.filter((b) => !isSameBill(b, self));
}
