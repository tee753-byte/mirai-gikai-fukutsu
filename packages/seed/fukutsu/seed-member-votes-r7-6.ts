/**
 * 議員別の賛否（bill_member_votes）を投入する（令和7年6月定例会分）。
 *
 * 出どころ: 福津市議会だより82号（6-7ページ「議案審議」）の賛否表。
 * PDF: https://www.city.fukutsu.lg.jp/material/files/group/20/06-07Pgikaidayori82.pdf
 *
 * 【他の号との違い】83号〜85号はスキャン画像で文字データが無く、目視または
 * ピクセル解析で読み取っている。82号はPDFに文字データが入っているため、
 * fukutsu/build-member-votes.ts で機械的に読み取って data/r7-6-votes.json に
 * 書き出している（10件×17人）。手作業の読み取り誤りが入らない代わりに、
 * 表の見出し文言は原文そのままになる。
 *
 * 会議録には「賛成多数であります」としか残らず、起立採決のため議員個人の賛否は
 * 分からない（fukutsu/parse-bill-votes.ts 参照）。この賛否表が唯一の一次資料。
 *
 * 【読み取りの検算】会議録の討論と突き合わせて、矛盾がないことを確認済み。
 *   議案第29号 … 反対討論2人（戸田・佐伯）がいずれも表でも反対
 *   発議第4号  … 反対討論1人（秦）が表でも反対、賛成討論2人（佐伯・戸田）が表でも賛成
 *   発議第6号  … 反対討論3人（尾島・秦・中村恵輔）がいずれも表でも反対、
 *                賛成討論2人（佐伯・戸田）がいずれも表でも賛成
 *   請願第1号  … 反対討論1人（中村晶代）が表でも反対、
 *                賛成討論2人（豆田・佐伯）がいずれも表でも賛成
 *   税条例（議案第32号）は16人全員が賛成で、討論も無い
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import r7_6Votes from "./data/r7-6-votes.json" with { type: "json" };
import { findMemberParty } from "./members";

// biome-ignore lint/suspicious/noExplicitAny: seedスクリプト内でのみ使う簡易クライアント型
type Client = SupabaseClient<any, "public", any>;

const SOURCE_NOTE = "議会だより82号の賛否表より作成";

/**
 * 議会だよりの賛否表の見出し文言 → 実際の議案番号（請願の番号を含む）。
 * 見出しは data/r7-6-votes.json の title と1字も違わないようにすること
 * （build-member-votes.ts がPDFから読み取ったままの文言）。
 */
const TITLE_TO_BILL_NUMBER: Record<string, string> = {
  "教育委員会委員の任命への同意（農﨑隆子さん）": "同意第9号",
  "令和７年度一般会計補正予算（第１号）": "議案第29号",
  "令和７年度後期高齢者医療事業特別会計補正予算（第１号）": "議案第30号",
  "令和７年度介護保険事業特別会計補正予算（第１号）": "議案第31号",
  税条例を改正: "議案第32号",
  "「子どもたちの豊かな学びの保障と、学校における働き方改革の確実な推進」を求める意見書の提出":
    "発議第4号",
  "物価高騰から国民生活を守るため、緊急に消費税減税を行うよう求める意見書の提出":
    "発議第5号",
  "基金運用における債券の含み損問題に関する調査のため特別委員会を設置する決議の提出":
    "発議第6号",
  "家族従業者の働き分を経費として認めない所得税法第56条の見直しを求める意見書の提出":
    "発議第7号",
  // 請願（petitions-r7-6.ts で bills に登録している）
  "「家族従業者の働き分を経費として認めない所得税法第56条の見直しを求める意見書」提出の請願":
    "請願第1号",
};

/** この期における議長。表決に参加しないため常に "chair" 扱いにする */
const CHAIR_NAME = "髙山賢二";

/** 議会だよりの賛否表の値 → bill_member_votes.vote の値 */
function toVoteValue(mark: string | null, memberName: string): string {
  if (memberName === CHAIR_NAME) return "chair";
  if (mark === "賛成") return "for";
  if (mark === "反対") return "against";
  // 表の「ー」。賛成にも反対にも数えない
  if (mark === "欠席") return "absent";
  if (mark === "棄権") return "abstain";
  throw new Error(
    `想定外の投票値です: ${memberName} = ${JSON.stringify(mark)}`
  );
}

type VoteRow = {
  title: string;
  votes: Record<string, string | null>;
};

/**
 * 対象セッション（r7-6）のbillを取得し、bill_member_votesを投入する。
 *
 * `sessionIds` で対象会期に限定する。議案番号は会期ごとに振り直されるため、
 * bill_number だけで検索すると別会期の議案に賛否を結びつけてしまう。
 */
export async function seedMemberVotesR7_6(
  supabase: Client,
  sessionIds: string[]
): Promise<number> {
  const { data: bills, error } = await supabase
    .from("bills")
    .select("id, bill_number")
    .in("bill_number", Object.values(TITLE_TO_BILL_NUMBER))
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

  const rows = (r7_6Votes as VoteRow[]).flatMap((entry) => {
    const billNumber = TITLE_TO_BILL_NUMBER[entry.title];
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
    throw new Error(
      `Failed to insert bill member votes: ${insertError.message}`
    );
  }

  return rows.length;
}
