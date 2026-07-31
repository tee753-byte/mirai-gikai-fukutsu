/**
 * 議員別の賛否（bill_member_votes）を投入する。
 *
 * 出どころ: 福津市議会だより85号（令和8年5月18日発行、1月臨時会・2月臨時会・
 * 3月定例会の3会期分の賛否表を掲載）。表そのものはスキャン画像でテキスト層が無く、
 * 目視で読み取った結果が data/r8-3-votes.json（52件×17人）として既に存在する。
 *
 * 会議録には「賛成多数であります」としか残らず、起立採決のため議員個人の賛否は
 * 分からない（fukutsu/parse-bill-votes.ts 参照）。この賛否表が唯一の一次資料。
 *
 * 承認・同意・諮問・適任など、議案一覧に掲載していない案件の投票データは
 * 対応するbillが無いため無視する（画面に出ないので実害はない）。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { findMemberParty } from "./members";
import r8_3Votes from "./data/r8-3-votes.json" with { type: "json" };

// biome-ignore lint/suspicious/noExplicitAny: seedスクリプト内でのみ使う簡易クライアント型
type Client = SupabaseClient<any, "public", any>;

const SOURCE_NOTE = "議会だより85号（令和8年5月18日発行）の賛否表より作成";

/** 議会だよりの賛否表の見出し文言 → 実際の議案番号。承認・同意等は対象外なので含めない */
const TITLE_TO_BILL_NUMBER: Record<string, string> = {
  // 1月臨時会
  "令和7年度一般会計補正予算(第6号)": "議案第1号",
  // 2月臨時会
  "福岡県市町村職員退職手当組合を組織する地方公共団体の数の減少及び福岡県市町村職員退職手当組合規約の変更":
    "議案第2号",
  "工事請負変更契約を締結(新設小学校造成工事(2工区))": "議案第3号",
  // 3月定例会
  "令和7年度一般会計補正予算(第7号)": "議案第4号",
  "令和7年度国民健康保険事業特別会計補正予算(第3号)": "議案第5号",
  "令和7年度後期高齢者医療事業特別会計補正予算(第4号)": "議案第6号",
  "令和7年度介護保険事業特別会計補正予算(第4号)": "議案第7号",
  "令和7年度公共下水道事業会計補正予算(第2号)": "議案第8号",
  "令和8年度一般会計予算": "議案第9号",
  "令和8年度国民健康保険事業特別会計予算": "議案第10号",
  "令和8年度後期高齢者医療事業特別会計予算": "議案第11号",
  "令和8年度介護保険事業特別会計予算": "議案第12号",
  "令和8年度公共下水道事業会計予算": "議案第13号",
  "一般職の職員の給与に関する条例を改正": "議案第15号",
  "特別職の職員で常勤のものの給与及び旅費に関する条例を改正": "議案第16号",
  "防災会議条例等を改正": "議案第17号",
  "行政手続条例を改正": "議案第18号",
  "武道館条例を改正": "議案第19号",
  "体育施設条例を改正": "議案第20号",
  "勝浦浜海洋スポーツセンター条例を改正": "議案第21号",
  "公民館条例を改正": "議案第22号",
  "複合文化センター条例を改正": "議案第23号",
  "市立学校の施設の開放に関する条例を改正": "議案第24号",
  "特定乳児等通園支援事業の運営に関する基準を定める条例の制定": "議案第14号",
  "市立保育所条例を改正": "議案第25号",
  "家庭的保育事業等の設備及び運営に関する基準を定める条例を改正": "議案第26号",
  "乳児等通園支援事業の設備及び運営に関する基準を定める条例を改正": "議案第27号",
  "国民健康保険税条例を改正": "議案第28号",
  "介護保険条例を改正": "議案第29号",
  "放課後児童健全育成事業の設備及び運営に関する基準を定める条例を改正":
    "議案第30号",
  "健康福祉総合センター条例を改正": "議案第31号",
  "福間会館条例を改正": "議案第32号",
  "下水道条例を改正": "議案第33号",
  "附属機関設置条例を改正": "議案第34号",
  "漁港管理条例を改正": "議案第35号",
  "火入れに関する条例を改正": "議案第36号",
  "農林漁業体験実習館条例を改正": "議案第37号",
  "まちおこしセンター条例を改正": "議案第38号",
  "津屋崎千軒民俗館条例を改正": "議案第39号",
  "津屋崎千軒古民家条例を改正": "議案第40号",
  "行政・観光情報ステーション条例を改正": "議案第41号",
  "公園条例を改正": "議案第42号",
  "コミュニティセンター条例を改正": "議案第43号",
  "郷づくり交流センター条例を改正": "議案第44号",
  "市道路線を認定": "議案第45号",
  "基金運用における債券の含み損問題に関する調査のため特別委員会を設置する決議":
    "発議第1号",
};

/** 議会だより85号の期における議長。表決に参加しないため常に "chair" 扱いにする */
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
 * 対象セッション（r8-1・r8-2・r8-3）のbillを取得し、bill_member_votesを投入する。
 * 承認・同意など議案一覧に無いものは対応するbillが見つからないため自動的にスキップされる。
 *
 * `sessionIds` で対象会期に限定する。会期をまたいで議案番号が重複することがある
 * （例: r7-12とr8-6にそれぞれ「議案第47号」が存在する）ため、bill_numberだけで
 * 検索すると別会期の議案に誤って投票データを結びつけてしまう可能性がある。
 */
export async function seedMemberVotes(
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

  const rows = (r8_3Votes as VoteRow[]).flatMap((entry) => {
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
