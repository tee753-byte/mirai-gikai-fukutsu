import type { BillTag, BillWithContent } from "../types";

// 議案カードに出す画像を決める。優先順位は次の3段階。
//
//   1. 件名のキーワード（KEYWORD_THUMBNAILS）… 施設名など、具体的なものが分かるとき
//   2. タグ（TAG_THUMBNAIL_BY_LABEL）        … キーワードに当てはまらないとき
//   3. 画像なし                              … どちらにも当てはまらないとき
//
// なぜキーワードが要るか: 本番80件のうち「施設・使用料」タグだけで16件あり、
// タグだけで決めると武道館・公民館・カメリアホール・公園・津屋崎千軒古民家・
// コミュニティセンターが全部同じ体育館の写真になってしまう。
// 補正予算も一般会計／国保／後期高齢者医療／介護保険／下水道で中身が違う。
//
// キーワードで分けきれない議案（議会・行政のしくみ／予算・財政の残り）は、
// 中身が本当にバラバラで意味のあるカテゴリに割れない。これらは1枚固定にせず
// 複数枚（variants）を用意し、議案ごとに決まった1枚が当たるようにしている
// （同じ議案なら常に同じ画像＝再訪でも見た目が変わらない）。
//
// 画像はすべて商用利用可・帰属表示不要の素材に限る。

type ThumbnailSrc = string | string[];

/**
 * variants から議案ごとに1枚を決める。ランダムではなく seed（議案名など）から
 * 計算するため、同じ議案は毎回同じ画像になる。サーバー側でHTMLを組み立てる際と
 * ブラウザ側の結果がずれるとハイドレーションエラーになるため、ここは
 * Math.random 等の非決定的な処理を使ってはいけない。
 */
function pickVariant(seed: string, variants: string[]): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return variants[Math.abs(hash) % variants.length];
}

function resolveThumbnailSrc(value: ThumbnailSrc, seed: string): string {
  return Array.isArray(value) ? pickVariant(seed, value) : value;
}

// タグに対応するデフォルトのサムネイル画像（フリー素材）。
// タグ名がDB側で変わった場合はここも合わせて更新する。
// 議会・行政のしくみ／予算・財政は、キーワードで分けた残りが依然として
// 中身の異なる議案の寄せ集めなので、2枚用意して交互に当たるようにしている。
export const TAG_THUMBNAIL_BY_LABEL: Record<string, ThumbnailSrc> = {
  "予算・財政": [
    "/images/tag-thumbnails/budget-finance.jpg",
    "/images/tag-thumbnails/budget-finance-2.jpg",
  ],
  "子育て・教育": "/images/tag-thumbnails/childcare-education.jpg",
  まちづくり: "/images/tag-thumbnails/town-development.jpg",
  "議会・行政のしくみ": [
    "/images/tag-thumbnails/council-system.jpg",
    "/images/tag-thumbnails/council-system-2.jpg",
  ],
  "意見書・決議": "/images/tag-thumbnails/opinion-resolution.jpg",
  "施設・使用料": "/images/tag-thumbnails/facility-fee.jpg",
  防災: "/images/tag-thumbnails/disaster-prevention.jpg",
};

type KeywordRule = {
  /** 件名または表示タイトルにこのいずれかが含まれていれば採用する */
  keywords: string[];
  src: ThumbnailSrc;
};

/**
 * 件名のキーワードで画像を決める表。
 *
 * **上から順に見て、最初に当てはまったものを使う。** そのため順番に意味がある。
 * 範囲の狭いもの（「津屋崎千軒」など固有の施設）を先に、
 * 広いもの（「センター」など）を後に置くこと。
 *
 * ここに載せてよいのは、`web/public` に実物のファイルがあるものだけ。
 * 存在しないパスを書くとカードの画像が読み込めず崩れる。
 * （この表と public のファイルの対応は tag-thumbnail.test.ts で検査している）
 *
 * 画像はいずれもPixabayのフリー素材（商用利用可・クレジット表記不要）。
 * カッコ内は令和7年12月〜令和8年6月定例会の該当件数。
 */
export const KEYWORD_THUMBNAILS: KeywordRule[] = [
  // 施設・使用料タグの16件を割る。ここが一番効く
  {
    keywords: ["津屋崎千軒"],
    src: "/images/tag-thumbnails/old-townhouse.jpg", // 民俗館・古民家（2件）
  },
  {
    keywords: ["複合文化センター", "福間会館"],
    src: "/images/tag-thumbnails/culture-hall.jpg", // カメリアホール等（2件）
  },
  {
    keywords: ["武道館", "体育施設", "海洋スポーツセンター"],
    src: "/images/tag-thumbnails/sports-facility.jpg", // （3件）
  },
  {
    keywords: ["公民館", "コミュニティセンター", "郷づくり交流センター"],
    src: "/images/tag-thumbnails/public-hall.jpg", // （3件）
  },
  {
    keywords: ["公園条例"],
    src: "/images/tag-thumbnails/park.jpg", // （1件）
  },
  {
    keywords: ["健康福祉総合センター"],
    src: "/images/tag-thumbnails/welfare-center.jpg", // ふくとぴあ（1件）
  },
  {
    keywords: ["下水道"],
    src: "/images/tag-thumbnails/sewerage.jpg", // 条例・会計あわせて（6件）
  },
  // 予算・財政タグの中身を分ける
  {
    keywords: ["国民健康保険", "後期高齢者医療"],
    src: "/images/tag-thumbnails/health-insurance.jpg", // （7件）
  },
  {
    keywords: ["介護保険"],
    src: "/images/tag-thumbnails/nursing-care.jpg", // （5件）
  },
  {
    // 「福津市国民健康保険税条例」は上の国民健康保険ルールで先に拾われるため、
    // ここには市税・専決処分の市税条例だけが残る
    keywords: ["福津市税条例"],
    src: "/images/tag-thumbnails/tax.jpg", // （2件）
  },
  // 議会・行政のしくみタグの中身を分ける（給与・報酬関連の条例改正）
  {
    keywords: ["給与", "議員報酬"],
    src: "/images/tag-thumbnails/pay-slip.jpg", // （7件）
  },
  // 子育て・教育タグの中身を分ける
  {
    // 「学童保育所」は下の保育所ルールにも部分一致してしまうため、
    // 先に個別指定して教室（机）の写真に寄せる（乳幼児向けの保育所と混同しないため）
    keywords: ["学童保育", "放課後児童"],
    src: "/images/tag-thumbnails/childcare-education.jpg", // （3件）
  },
  {
    keywords: ["保育所", "通園", "保育士", "家庭的保育"],
    src: "/images/tag-thumbnails/nursery.jpg", // （5件）
  },
  {
    keywords: ["小学校", "学校の施設", "学校の開放", "教職員"],
    src: "/images/tag-thumbnails/school.jpg", // （5件）
  },
  // まちづくりタグ
  {
    keywords: ["火入れ", "野焼き"],
    src: "/images/tag-thumbnails/dry-field.jpg", // 野焼き・枯れ草（1件）。タグ既定のtown-development.jpgは漁港風景で噛み合わないため個別指定
  },
  {
    keywords: ["漁港"],
    src: "/images/tag-thumbnails/fishing-port.jpg", // 福間漁港（1件）
  },
  {
    keywords: ["市道路線"],
    src: "/images/tag-thumbnails/road.jpg", // （1件）
  },
];

/**
 * 議案に付いているタグから、デフォルトのサムネイル画像パスを返す。
 * 複数タグがある場合は先頭のタグを優先する。対応する画像が無ければ undefined。
 *
 * seed は複数枚から1枚を選ぶときの手がかり（議案名など）。省略時はタグ名を使う
 * ため、同じタグの議案が全部同じ1枚目になる＝実質1枚しか使われない状態になる。
 */
export function getTagThumbnail(
  tags: BillTag[] | undefined,
  seed?: string
): string | undefined {
  if (!tags) return undefined;
  for (const tag of tags) {
    const value = TAG_THUMBNAIL_BY_LABEL[tag.label];
    if (value) return resolveThumbnailSrc(value, seed ?? tag.label);
  }
  return undefined;
}

/** 件名・表示タイトルのキーワードから画像パスを返す。当てはまらなければ undefined */
export function getKeywordThumbnail(
  billName: string | undefined,
  displayTitle: string | undefined
): string | undefined {
  const haystack = `${billName ?? ""} ${displayTitle ?? ""}`;
  if (haystack.trim() === "") return undefined;

  for (const rule of KEYWORD_THUMBNAILS) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return resolveThumbnailSrc(rule.src, billName ?? displayTitle ?? "");
    }
  }
  return undefined;
}

/**
 * 議案カードに出す画像を決める。キーワード → タグ → 画像なし の順に見る。
 *
 * 管理画面から議案ごとに設定した画像（bills.thumbnail_url）は、これより
 * さらに優先される。呼び出し側で `bill.thumbnail_url ?? getBillThumbnail(bill)`
 * のように書くこと。
 */
export function getBillThumbnail(
  bill: Pick<BillWithContent, "name" | "tags" | "bill_content">
): string | undefined {
  return (
    getKeywordThumbnail(bill.name, bill.bill_content?.title) ??
    getTagThumbnail(bill.tags, bill.name)
  );
}
