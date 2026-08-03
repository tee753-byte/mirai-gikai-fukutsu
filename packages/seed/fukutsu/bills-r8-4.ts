/**
 * 令和8年4月臨時会（第4回）の議案データ。
 *
 * 出どころ:
 * - 議案番号・件名・議決結果 … 福津市議会「議決結果（令和8年4月臨時会）」
 * - 議案の内容 … 福津市議会 令和8年第4回臨時会 議案書
 * - やさしいタイトルと要約 … 上記をもとにAIが平易に書き直したもの
 *
 * 【この会期の掲載状態】会議録がまだ公開されていないため、提案理由の説明・
 * 討論・採決の方法は載せていない（voteMethod は null）。公開され次第追加する。
 *
 * 【報告第3〜8号について】この臨時会では損害賠償に関する専決処分の報告が
 * 5件あったが、報告は議決の対象ではないため議案としては掲載していない。
 * また、いずれも市民個人が相手方となる事案であり、私人の個人情報にあたる
 * 内容を含むため、詳細は扱わない。
 */
import {
  type BillVoteRecord,
  contractSystemNote,
  type PlainText,
} from "./seed-bills-common";

export const R8_4_SESSION_SLUG = "r8-4";
export const R8_4_SOURCE_URL =
  "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19631.html";

/** 4月臨時会は1日開催（令和8年4月24日） */
export function decidedAt(_sessionDay: number): string {
  return "2026-04-24";
}

export function submittedAt(_billNumber: string): string {
  return "2026-04-24";
}

/**
 * 会議録がないため、議決結果PDFと議案書から手で組み立てている。
 * debates・committeeReport・sponsors は会議録由来の情報なので空にする。
 */
export const BILL_VOTES_R8_4: BillVoteRecord[] = [
  {
    billNumber: "承認第2号",
    billName:
      "専決処分した事件の承認について（令和7年度福津市一般会計補正予算（専決第3号））",
    outcome: "approved",
    // 会議録が未公開のため、採決の方法は不明
    voteMethod: null as unknown as BillVoteRecord["voteMethod"],
    sessionDay: 1,
    debates: [],
    proposalReason: null,
    committeeReport: null,
    sponsors: [],
    sourceFile: "議決結果（令和8年4月臨時会）",
  },
  {
    billNumber: "承認第3号",
    billName:
      "専決処分した事件の承認について（福津市税条例の一部を改正することについて）",
    outcome: "approved",
    voteMethod: null as unknown as BillVoteRecord["voteMethod"],
    sessionDay: 1,
    debates: [],
    proposalReason: null,
    committeeReport: null,
    sponsors: [],
    sourceFile: "議決結果（令和8年4月臨時会）",
  },
  {
    billNumber: "承認第4号",
    billName:
      "専決処分した事件の承認について（福津市国民健康保険税条例の一部を改正することについて）",
    outcome: "approved",
    voteMethod: null as unknown as BillVoteRecord["voteMethod"],
    sessionDay: 1,
    debates: [],
    proposalReason: null,
    committeeReport: null,
    sponsors: [],
    sourceFile: "議決結果（令和8年4月臨時会）",
  },
  {
    billNumber: "議案第46号",
    billName: "工事請負契約を締結することについて",
    outcome: "approved",
    voteMethod: null as unknown as BillVoteRecord["voteMethod"],
    sessionDay: 1,
    debates: [],
    proposalReason: null,
    committeeReport: null,
    sponsors: [],
    sourceFile: "議決結果（令和8年4月臨時会）",
  },
];

export const PLAIN_TEXTS: Record<string, PlainText> = {
  承認第2号: {
    title: "年度末に組み替えた今年度予算を、あとから議会が承認する",
    summary:
      "令和7年度の一般会計予算を3億7,973万7千円増やし、総額を323億255万2千円とする補正予算です。市長が令和8年3月31日に専決処分（議会を待たずに決定）したものを、あとから議会が承認しました。地方債の変更も含まれます。",
    reasonPlain:
      "市は、地方交付税や地方譲与税、交付金などの歳入の額が確定したため、積立金を増やし予備費を減らす財源の調整が必要になったと説明しています。確定したのが3月末で、議会を招集する時間の余裕がなかったことから、市長が専決処分したとしています。",
    tag: "予算・財政",
    committee: null,
  },
  承認第3号: {
    title: "法改正にあわせた市税条例の改正を、あとから議会が承認する",
    summary:
      "国の税制改正にあわせて福津市税条例を改正するもので、市長が令和8年3月31日に専決処分したものを、あとから議会が承認しました。年度替わりに間に合わせる必要があるため、毎年この形で処理されます。",
    reasonPlain:
      "市は、地方税法などを改める法律が令和8年3月31日に公布されたことに伴い、関係する市税条例を直す必要が生じたため、市長が専決処分したと説明しています。",
    tag: "予算・財政",
    committee: null,
  },
  承認第4号: {
    title:
      "法改正にあわせた国民健康保険税条例の改正を、あとから議会が承認する",
    summary:
      "国の制度改正にあわせて福津市国民健康保険税条例を改正するもので、市長が令和8年3月31日に専決処分したものを、あとから議会が承認しました。",
    reasonPlain:
      "市は、地方税法施行令などを改める政令が令和8年3月31日に公布されたことに伴い、関係する市の国民健康保険税条例を直す必要が生じたため、市長が専決処分したと説明しています。",
    tag: "くらし・まちづくり",
    committee: null,
  },
  議案第46号: {
    title: "新設小学校の学童保育所を建てる工事契約を結ぶ（1億9,250万円）",
    summary:
      "令和9年4月に開校する宮司地区の新設小学校の敷地内に、学童保育所を新築する工事の請負契約です。契約金額は1億9,250万円、工期は令和9年2月25日まで。制限付一般競争入札により、株式会社片岡建設（福津市本木）が請け負います。",
    systemNote: contractSystemNote({ hasMinutes: false }),
    tag: "子育て・教育",
    committee: "総務文教委員会",
  },
};
