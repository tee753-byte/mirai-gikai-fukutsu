/**
 * 議員別の賛否（bill_member_votes）を投入する（令和7年12月定例会分）。
 *
 * 出どころ: 福津市議会だより84号（令和8年2月1日発行、冬号）。表そのものはスキャン画像で
 * テキスト層が無く、目視で読み取った結果が data/r7-12-votes.json（18件×16人）として存在する。
 * PDF: https://www.city.fukutsu.lg.jp/material/files/group/20/gikaidayori84all.pdf
 *
 * 会議録には「賛成多数であります」としか残らず、起立採決のため議員個人の賛否は
 * 分からない（fukutsu/parse-bill-votes.ts 参照）。この賛否表が唯一の一次資料。
 *
 * 18件のうち2件（福間南小学校の教育環境整備を求める請願／在自土石流危険区域の被害軽減に
 * 関する請願）は請願であり、bills-r7-12.tsのPLAIN_TEXTSに対応する議案が無い（画面に
 * 議案として出ないので実害はない）。TITLE_TO_BILL_NUMBERに含めず自動的にスキップする。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { findMemberParty } from "./members";
import r7_12Votes from "./data/r7-12-votes.json" with { type: "json" };

// biome-ignore lint/suspicious/noExplicitAny: seedスクリプト内でのみ使う簡易クライアント型
type Client = SupabaseClient<any, "public", any>;

const SOURCE_NOTE = "議会だより84号（令和8年2月1日発行）の賛否表より作成";

/** 議会だよりの賛否表の見出し文言 → 実際の議案番号。請願は対象外なので含めない */
const TITLE_TO_BILL_NUMBER: Record<string, string> = {
  "市一般職の職員の給与に関する条例を改正（人事院勧告に伴う改正）": "議案第43号",
  "市議会の議員の議員報酬及び費用弁償等に関する条例を改正（国家公務員に準拠する改正）":
    "議案第44号",
  "市特別職の職員で常勤のものの給与及び旅費に関する条例を改正（国家公務員に準拠する改正）":
    "議案第45号",
  "宗像地区事務組合規約を変更": "議案第46号",
  "令和7年度一般会計補正予算(第5号)": "議案第47号",
  "令和7年度国民健康保険事業特別会計補正予算(第2号)": "議案第48号",
  "令和7年度後期高齢者医療事業特別会計補正予算(第3号)": "議案第49号",
  "令和7年度介護保険事業特別会計補正予算(第3号)": "議案第50号",
  "令和7年度公共下水道事業会計補正予算(第1号)": "議案第51号",
  "部設置条例を改正": "議案第53号",
  "個人番号の利用及び特定個人情報の提供に関する条例を改正": "議案第54号",
  "手数料条例及び印鑑条例を改正": "議案第55号",
  "神興東小学校学童保育所・上西郷小学校学童保育所の指定管理者を指定": "議案第56号",
  "農地災害復旧事業分担金徴収条例を制定": "議案第52号",
  "自転車等駐車場・自動車駐車場の指定管理者を指定": "議案第57号",
  "市議会の議員の議員報酬及び費用弁償等に関する条例を改正（議会広報調査特別委員長の報酬を委員長の額とする改正）":
    "発議第8号",
};

/** 議会だより84号の期における議長。表決に参加しないため常に "chair" 扱いにする */
const CHAIR_NAME = "髙山賢二";

/** 議会だよりの賛否表の値 → bill_member_votes.vote の値。null は議長のみに出現する */
function toVoteValue(mark: string | null, memberName: string): string {
  if (memberName === CHAIR_NAME) return "chair";
  if (mark === "賛成") return "for";
  if (mark === "反対") return "against";
  throw new Error(
    `想定外の投票値です: ${memberName} = ${JSON.stringify(mark)}`
  );
}

type VoteRow = {
  title: string;
  votes: Record<string, string | null>;
};

/**
 * 対象セッション（r7-12）のbillを取得し、bill_member_votesを投入する。
 * 請願など議案一覧に無いものは対応するbillが見つからないため自動的にスキップされる。
 */
export async function seedMemberVotesR7_12(
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

  const rows = (r7_12Votes as VoteRow[]).flatMap((entry) => {
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
    throw new Error(`Failed to insert bill member votes: ${insertError.message}`);
  }

  return rows.length;
}
