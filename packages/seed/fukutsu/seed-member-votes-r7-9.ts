/**
 * 議員別の賛否（bill_member_votes）を投入する（令和7年9月定例会分）。
 *
 * 出どころ: 福津市議会だより83号「公開します。みんなの賛成と反対」の賛否表。
 * 表そのものはスキャン画像でテキスト層が無く、目視で読み取った結果が
 * data/r7-9-votes.json（17件×17人）として存在する。
 * PDF: https://www.city.fukutsu.lg.jp/material/files/group/20/06-07Pgikaidayori83.pdf
 *
 * 会議録には「賛成多数であります」としか残らず、起立採決のため議員個人の賛否は
 * 分からない（fukutsu/parse-bill-votes.ts 参照）。この賛否表が唯一の一次資料。
 *
 * 【この会期の特徴】
 * ・決算認定5件（認定第1〜5号）と請願1件（請願第2号）を含む。いずれも bills に
 *   登録しているため、TITLE_TO_BILL_NUMBER に含めて賛否も表示する。
 * ・補正予算5件で欠席（表では「－」）が1人おり、"absent" として投入する。
 *   賛成・反対のどちらでもないため、賛否の人数に混ぜてはいけない。
 *
 * 【読み取りの検算】会議録の討論と突き合わせて、矛盾がないことを確認済み。
 *   認定第1号 … 反対討論3人（山本・佐伯・戸田）がいずれも表でも反対
 *   請願第2号 … 反対討論3人（山本・尾島・榎本）がいずれも表でも反対、
 *                賛成討論2人（秦・岩下）がいずれも表でも賛成
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import r7_9Votes from "./data/r7-9-votes.json" with { type: "json" };
import { findMemberParty } from "./members";

// biome-ignore lint/suspicious/noExplicitAny: seedスクリプト内でのみ使う簡易クライアント型
type Client = SupabaseClient<any, "public", any>;

const SOURCE_NOTE = "議会だより83号の賛否表より作成";

/** 議会だよりの賛否表の見出し文言 → 実際の議案番号（認定・請願の番号を含む） */
const TITLE_TO_BILL_NUMBER: Record<string, string> = {
  "専決処分した事件の承認（令和7年度一般会計補正予算（専決第1号））": "承認第3号",
  "令和7年度一般会計補正予算(第2号)": "議案第33号",
  "令和7年度国民健康保険事業特別会計補正予算(第1号)": "議案第34号",
  "令和7年度後期高齢者医療事業特別会計補正予算(第2号)": "議案第35号",
  "令和7年度介護保険事業特別会計補正予算(第2号)": "議案第36号",
  "令和7年度一般会計補正予算(第3号)": "議案第41号",
  "令和7年度一般会計補正予算(第4号)": "議案第42号",
  "令和6年度一般会計決算の認定": "認定第1号",
  "令和6年度国民健康保険事業特別会計決算の認定": "認定第2号",
  "令和6年度後期高齢者医療事業特別会計決算の認定": "認定第3号",
  "令和6年度介護保険事業特別会計決算の認定": "認定第4号",
  "令和6年度公共下水道事業会計決算の認定": "認定第5号",
  "市職員の育児休業等に関する条例を改正": "議案第38号",
  "市職員の勤務時間、休暇等に関する条例を改正": "議案第39号",
  財産の取得: "議案第40号",
  "児童福祉法等の一部改正に伴う関係条例の整理に関する条例を制定": "議案第37号",
  // 請願（petitions-r7-9.ts で bills に登録している）
  "学校給食費の無償化を求める請願": "請願第2号",
};

/** この期における議長。表決に参加しないため常に "chair" 扱いにする */
const CHAIR_NAME = "髙山賢二";

/** 議会だよりの賛否表の値 → bill_member_votes.vote の値 */
function toVoteValue(mark: string | null, memberName: string): string {
  if (memberName === CHAIR_NAME) return "chair";
  if (mark === "賛成") return "for";
  if (mark === "反対") return "against";
  // 表の「－」。賛成にも反対にも数えない
  if (mark === "欠席") return "absent";
  throw new Error(
    `想定外の投票値です: ${memberName} = ${JSON.stringify(mark)}`
  );
}

type VoteRow = {
  title: string;
  votes: Record<string, string | null>;
};

/**
 * 対象セッション（r7-9）のbillを取得し、bill_member_votesを投入する。
 *
 * `sessionIds` で対象会期に限定する。議案番号は会期ごとに振り直されるため、
 * bill_number だけで検索すると別会期の議案に賛否を結びつけてしまう。
 */
export async function seedMemberVotesR7_9(
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

  const rows = (r7_9Votes as VoteRow[]).flatMap((entry) => {
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
