/**
 * 福津市議会議員の基本情報。
 *
 * 出典は市が公開している「議員名簿」と「議長と副議長」のページ。
 *
 * 掲載する項目は、議会での立場が分かるものだけに絞っている。市の名簿には
 * 住所・電話番号・メールアドレス・生まれ年・写真も載っているが、
 * 議員が議会で何をしたかを知るという目的には関係がなく、非公式サイトが
 * 個人の連絡先を再掲する必要もないため取り込まない。
 *
 * 会派と党派は別のもの。会派は議会内で活動をともにする集まりで、
 * 委員会の割り当てや議案への対応の単位になる。党派は所属している政党。
 * 「無所属」の議員が会派に入っていることもあるため、両方を出す。
 */

export type CouncilMemberProfile = {
  /** URL 用の識別子。氏名から空白を除いたもの（toQuestionerSlug と同じ規則） */
  slug: string;
  name: string;
  kana: string;
  /** 所属会派。どこにも属さない場合は「無会派」 */
  caucus: string;
  /** 党派。政党に属さない場合は「無所属」 */
  party: string;
  /** 当選回数 */
  terms: number;
  /** 所属する常任委員会。議長は所属しないため null */
  committee: string | null;
  /**
   * 議長・副議長。役職がなければ null。
   * 画面には出していないが、議長が常任委員会に所属しない理由がこれで分かるため残す。
   */
  role: string | null;
};

/** 出典ページ。プロフィールを出す画面には必ずこのリンクを添える */
export const MEMBER_ROSTER_URL =
  "https://www.city.fukutsu.lg.jp/gikai/kosei/2353.html";

/** 議長・副議長の出典ページ */
export const COUNCIL_CHAIR_URL =
  "https://www.city.fukutsu.lg.jp/gikai/kosei/2350.html";

/** 現在の議員の任期 */
export const COUNCIL_TERM_LABEL = "令和5年1月24日〜令和9年1月23日";

/** 市の名簿ページに表示されている更新日 */
export const MEMBER_PROFILE_SOURCE_DATE = "2025年11月6日";

/**
 * 並び順は市の名簿ページの掲載順（当選回数の少ない順）をそのまま使う。
 * 質問の回数や発言量で並べ替えると、議員の評価を誤らせるため。
 */
export const COUNCIL_MEMBER_PROFILES: CouncilMemberProfile[] = [
  {
    slug: "大山隆之",
    name: "大山 隆之",
    kana: "おおやま たかゆき",
    caucus: "新政会",
    party: "無所属",
    terms: 1,
    committee: "市民福祉委員会",
    role: null,
  },
  {
    slug: "中村恵輔",
    name: "中村 恵輔",
    kana: "なかむら けいすけ",
    caucus: "無会派",
    party: "無所属",
    terms: 1,
    committee: "総務文教委員会",
    role: null,
  },
  {
    slug: "山本祐平",
    name: "山本 祐平",
    kana: "やまもと ゆうへい",
    caucus: "無会派",
    party: "無所属",
    terms: 1,
    committee: "市民福祉委員会",
    role: null,
  },
  {
    slug: "岩下豊",
    name: "岩下 豊",
    kana: "いわした ゆたか",
    caucus: "日本共産党",
    party: "日本共産党",
    terms: 1,
    committee: "総務文教委員会",
    role: null,
  },
  {
    slug: "井手口忠信",
    name: "井手口 忠信",
    kana: "いでぐち ただのぶ",
    caucus: "公明党",
    party: "公明党",
    terms: 1,
    committee: "建設環境委員会",
    role: null,
  },
  {
    slug: "倉元敏徳",
    name: "倉元 敏徳",
    kana: "くらもと としのり",
    caucus: "福津誠和会",
    party: "無所属",
    terms: 1,
    committee: "建設環境委員会",
    role: null,
  },
  {
    slug: "佐伯美保",
    name: "佐伯 美保",
    kana: "さえき みほ",
    caucus: "みんなの声によるみんなの会",
    party: "無所属",
    terms: 1,
    committee: "総務文教委員会",
    role: null,
  },
  {
    slug: "秦浩",
    name: "秦 浩",
    kana: "はた ひろし",
    caucus: "福津誠和会",
    party: "無所属",
    terms: 2,
    committee: "市民福祉委員会",
    role: null,
  },
  {
    slug: "石田まなみ",
    name: "石田 まなみ",
    kana: "いしだ まなみ",
    caucus: "ミモザの会",
    party: "社会民主党",
    terms: 2,
    committee: "総務文教委員会",
    role: null,
  },
  {
    slug: "中村晶代",
    name: "中村 晶代",
    kana: "なかむら あきよ",
    caucus: "公明党",
    party: "公明党",
    terms: 2,
    committee: "市民福祉委員会",
    role: null,
  },
  {
    slug: "尾島武弘",
    name: "尾島 武弘",
    kana: "おじま たけひろ",
    caucus: "新政会",
    party: "無所属",
    terms: 2,
    committee: "総務文教委員会",
    role: null,
  },
  {
    // 市の名簿では「高」と表記し、はしご高である旨の注記が添えられている
    slug: "髙山賢二",
    name: "髙山 賢二",
    kana: "たかやま けんじ",
    caucus: "福津誠和会",
    party: "無所属",
    terms: 2,
    // 議長は常任委員会に所属しない
    committee: null,
    role: "議長",
  },
  {
    slug: "豆田優子",
    name: "豆田 優子",
    kana: "まめだ ゆうこ",
    caucus: "ミモザの会",
    party: "ふくおか市民政治ネットワーク",
    terms: 3,
    committee: "建設環境委員会",
    role: null,
  },
  {
    slug: "中村清隆",
    name: "中村 清隆",
    kana: "なかむら きよたか",
    caucus: "無会派",
    party: "無所属",
    terms: 3,
    committee: "総務文教委員会",
    role: "副議長",
  },
  {
    slug: "戸田進一",
    name: "戸田 進一",
    kana: "とだ しんいち",
    caucus: "日本共産党",
    party: "日本共産党",
    terms: 4,
    committee: "市民福祉委員会",
    role: null,
  },
  {
    slug: "榎本博",
    name: "榎本 博",
    kana: "えのもと ひろし",
    caucus: "みんなの声によるみんなの会",
    party: "無所属",
    terms: 4,
    committee: "建設環境委員会",
    role: null,
  },
  {
    slug: "米山信",
    name: "米山 信",
    kana: "よねやま あきら",
    caucus: "新政会",
    party: "無所属",
    terms: 6,
    committee: "建設環境委員会",
    role: null,
  },
];

const BY_SLUG = new Map(COUNCIL_MEMBER_PROFILES.map((m) => [m.slug, m]));

/**
 * 氏名からプロフィールを引く。
 *
 * 会議録は「山本祐平」、一般質問の通告書は「山本 祐平」と空白の有無が揺れるため、
 * 空白を除いた形で突き合わせる。名簿に無い議員（任期途中の異動など）は null。
 */
export function findMemberProfile(name: string): CouncilMemberProfile | null {
  return BY_SLUG.get(name.replace(/[\s　]/g, "")) ?? null;
}
