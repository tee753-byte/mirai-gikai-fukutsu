/**
 * 議員別の賛否（bill_member_votes）を投入する（令和8年4月臨時会・6月定例会分）。
 *
 * 出どころ: 福津市議会だより86号（令和8年9月1日発行、6-7ページ「議案審議」）の賛否表。
 * この号には4月臨時会と6月定例会の2会期分が1つの表にまとめて載っている。
 *
 * 【他の号との違い】86号は議員名・案件名・議決結果は文字として入っているのに、
 * ○●だけが図形で描かれている（PDFを検索しても○●は凡例の3つしか出てこない）。
 * そのため build-member-votes.ts では読めず、格子の位置を文字から決めて記号を
 * 画像から判定する fukutsu/build-member-votes-image.ts で読み取っている。
 *
 *   npx tsx fukutsu/build-member-votes-image.ts "<賛否表ページのPDF>" \
 *     --split "4月臨時会=r8-4,6月定例会=r8-6"
 *
 * 会議録には「賛成多数であります」としか残らず、起立採決のため議員個人の賛否は
 * 分からない（fukutsu/parse-bill-votes.ts 参照）。この賛否表が唯一の一次資料。
 *
 * 【読み取りの検算】会議録の討論と突き合わせて、矛盾がないことを確認済み。
 *   議案第47号 … 反対討論1人（岩下）が表でも反対、賛成討論1人（山本）が表でも賛成
 *   議案第49号 … 反対討論3人（豆田・佐伯・戸田）がいずれも表でも反対。
 *                賛成7・反対9で、会議録の「賛成少数により否決」と一致する
 *   議案第51号 … 反対討論1人（戸田）が表でも反対
 *   発議第5号  … 反対討論1人（山本）が表でも唯一の反対、賛成討論1人（戸田）が表でも賛成
 *   発議第4号  … 賛成討論1人（岩下）が表でも賛成。16人全員が賛成で反対討論も無い
 * さらに15件すべてで、可決は賛成多数・否決は賛成少数になっていることを確認している。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import r8_4Votes from "./data/r8-4-votes.json" with { type: "json" };
import r8_6Votes from "./data/r8-6-votes.json" with { type: "json" };
import { findMemberParty } from "./members";

// biome-ignore lint/suspicious/noExplicitAny: seedスクリプト内でのみ使う簡易クライアント型
type Client = SupabaseClient<any, "public", any>;

const SOURCE_NOTE = "議会だより86号（令和8年9月1日発行）の賛否表より作成";

/**
 * 議会だよりの賛否表の見出し文言 → 実際の議案番号。
 * 見出しは data/<slug>-votes.json の title と1字も違わないようにすること
 * （build-member-votes-image.ts がPDFから読み取ったままの文言）。
 */
const TITLE_TO_BILL_NUMBER_R8_4: Record<string, string> = {
  "専決処分した事件の承認（令和７年度一般会計補正予算（専決第３号））": "承認第2号",
  "専決処分した事件の承認（税条例の一部を改正）": "承認第3号",
  "専決処分した事件の承認（国民健康保険税条例の一部を改正）": "承認第4号",
  "工事請負契約を締結（新設小学校学童保育所新築工事）": "議案第46号",
};

const TITLE_TO_BILL_NUMBER_R8_6: Record<string, string> = {
  "令和８年度一般会計補正予算（第１号）": "議案第47号",
  "令和８年度介護保険事業特別会計補正予算（第１号）": "議案第48号",
  "特別職の職員で常勤のものの給与及び旅費に関する条例を改正": "議案第49号",
  税条例を改正: "議案第50号",
  学童保育所条例を改正: "議案第51号",
  財産の取得: "議案第52号",
  議会基本条例を制定: "発議第2号",
  議会会議規則を改正: "発議第3号",
  "非核三原則の堅持を求める意見書を提出": "発議第4号",
  "ホルムズ海峡情勢の影響から市民生活と地域経済を守るための対策を求める意見書を提出":
    "発議第5号",
  "ゆたかな学びの実現・教職員定数改善を図るための、令和９年度政府予算に係る意見書を提出":
    "発議第6号",
};

/** この期における議長。表決に参加しないため常に "chair" 扱いにする */
const CHAIR_NAME = "髙山賢二";

/** 議会だよりの賛否表の値 → bill_member_votes.vote の値 */
function toVoteValue(mark: string | null, memberName: string): string {
  if (memberName === CHAIR_NAME) return "chair";
  if (mark === "賛成") return "for";
  if (mark === "反対") return "against";
  if (mark === "欠席") return "absent";
  if (mark === "棄権") return "abstain";
  throw new Error(`想定外の投票値です: ${memberName} = ${JSON.stringify(mark)}`);
}

type VoteRow = {
  title: string;
  votes: Record<string, string | null>;
};

/**
 * 賛否表1会期ぶんを投入する。
 *
 * `sessionIds` で対象会期に限定する。議案番号は会期ごとに振り直されるため、
 * bill_number だけで検索すると別会期の議案に賛否を結びつけてしまう。
 */
async function seedOneSession(
  supabase: Client,
  sessionIds: string[],
  votes: VoteRow[],
  titleToBillNumber: Record<string, string>
): Promise<number> {
  const { data: bills, error } = await supabase
    .from("bills")
    .select("id, bill_number")
    .in("bill_number", Object.values(titleToBillNumber))
    .in("council_session_id", sessionIds);

  if (error) {
    throw new Error(`Failed to fetch bills for member votes: ${error.message}`);
  }

  const billIdByNumber = new Map(
    (bills ?? []).map((b: { id: string; bill_number: string }) => [
      b.bill_number,
      b.id,
    ])
  );

  const rows = votes.flatMap((entry) => {
    const billNumber = titleToBillNumber[entry.title];
    const billId = billNumber ? billIdByNumber.get(billNumber) : undefined;
    if (!billId) return [];

    return Object.entries(entry.votes).map(([memberName, mark]) => ({
      bill_id: billId,
      member_name: memberName,
      member_party: findMemberParty(memberName),
      vote: toVoteValue(mark, memberName),
      source_note: SOURCE_NOTE,
    }));
  });

  if (rows.length === 0) return 0;

  const { error: insertError } = await supabase
    .from("bill_member_votes")
    .insert(rows);
  if (insertError) {
    throw new Error(`Failed to insert bill member votes: ${insertError.message}`);
  }

  return rows.length;
}

export function seedMemberVotesR8_4(
  supabase: Client,
  sessionIds: string[]
): Promise<number> {
  return seedOneSession(
    supabase,
    sessionIds,
    r8_4Votes as VoteRow[],
    TITLE_TO_BILL_NUMBER_R8_4
  );
}

export function seedMemberVotesR8_6(
  supabase: Client,
  sessionIds: string[]
): Promise<number> {
  return seedOneSession(
    supabase,
    sessionIds,
    r8_6Votes as VoteRow[],
    TITLE_TO_BILL_NUMBER_R8_6
  );
}
