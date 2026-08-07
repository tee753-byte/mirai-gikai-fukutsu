// 一般質問カードに出すバナー画像を、テーマの件名キーワードから決める。
//
// 議案カード（bills/shared/utils/tag-thumbnail.ts）と同じ「キーワード→画像」の考え方だが、
// 一般質問は会期ごとに議員が自由記述でテーマを書くため、議案のタグのような固定分類が無い。
// そのため2段構えにしている。
//
//   1. TOPIC_KEYWORD_THUMBNAILS（個別キーワード）… テーマがはっきり分かるとき
//   2. BROAD_CATEGORY_THUMBNAILS（大分類キーワード）… 個別キーワードに当てはまらないとき
//
// 議案と違って「画像なし」は作らない方針（2026-08-07に運営者と合意）。新しい定例会が
// 追加されるたびに、大分類のどれにも引っかからないテーマが出てくる可能性があるので、
// `/dev/features/general-questions/topic-thumbnail-coverage` で定期的にカバー状況を確認し、
// 個別キーワードを追加していく運用が前提。
//
// 画像はすべて商用利用可・帰属表示不要の素材、または議案カードの画像を流用。

type KeywordRule = {
  keywords: string[];
  src: string;
};

type BroadCategoryRule = KeywordRule & { label: string };

/**
 * 個別キーワード。ここに当てはまれば、大分類より具体的な画像が出る。
 * 上から順に見て、最初に当てはまったものを使う。
 */
export const TOPIC_KEYWORD_THUMBNAILS: KeywordRule[] = [
  {
    keywords: ["学校給食", "給食"],
    src: "/images/tag-thumbnails/school.jpg",
  },
  {
    keywords: ["財政", "市政運営", "予算"],
    src: "/images/tag-thumbnails/budget-finance.jpg",
  },
  {
    keywords: ["情報公開", "議事録", "行政運営", "デジタル化"],
    src: "/images/tag-thumbnails/council-system.jpg",
  },
  {
    keywords: ["子育て", "保育", "児童"],
    src: "/images/tag-thumbnails/childcare-education.jpg",
  },
  {
    keywords: ["防災", "災害"],
    src: "/images/tag-thumbnails/disaster-prevention.jpg",
  },
  {
    keywords: ["介護", "高齢者", "福祉"],
    src: "/images/tag-thumbnails/nursing-care.jpg",
  },
];

/**
 * 大分類キーワード（個別キーワードに当てはまらなかった場合の受け皿）。
 * 6分類のうち5つは議案カードの画像を流用。「産業・地域振興」だけ、
 * ふさわしい写真がまだ見つかっていないため町並みの写真で仮置きしている
 * （2026-08-07時点。差し替え候補が見つかり次第ここを更新する）。
 */
export const BROAD_CATEGORY_THUMBNAILS: BroadCategoryRule[] = [
  {
    label: "防災・安全",
    keywords: ["防災", "災害", "豪雨", "水害", "河川", "消防"],
    src: "/images/tag-thumbnails/disaster-prevention.jpg",
  },
  {
    label: "教育・学校",
    keywords: ["学校", "小学校", "中学", "通学", "教育", "図書館", "プール"],
    src: "/images/tag-thumbnails/school.jpg",
  },
  {
    label: "くらし・福祉",
    keywords: [
      "福祉",
      "障が",
      "生活困窮",
      "生活保護",
      "ひきこもり",
      "健診",
      "保健",
      "予防",
      "こども",
      "子ども",
      "子育て",
      "産婦",
      "相談",
      "いじめ",
      "不登校",
      "SOS",
      "学び",
      "香害",
      "オストメイト",
      "権利擁護",
      "介護",
      "高齢者",
    ],
    src: "/images/tag-thumbnails/nursing-care.jpg",
  },
  {
    // 画像は仮置き。TODO: 商店街・地域経済らしい専用画像に差し替える
    label: "産業・地域振興",
    keywords: [
      "企業",
      "商工",
      "産業",
      "観光",
      "拠点",
      "農業",
      "鳥獣",
      "産廃",
      "古墳",
      "キャンプ場",
      "にぎわい",
      "経済",
      "誘致",
      "減税",
      "稼げるまち",
    ],
    src: "/images/tag-thumbnails/town-development.jpg",
  },
  {
    label: "行政・議会運営",
    keywords: ["情報公開", "議事録", "行財政", "行政運営", "職員", "自治会"],
    src: "/images/tag-thumbnails/council-system.jpg",
  },
  {
    // 最後に置く。「まち」等の広い語を含むため
    label: "まちづくり・インフラ",
    keywords: [
      "使用料",
      "指定管理",
      "公共施設",
      "公共交通",
      "バス",
      "タクシー",
      "都市計画",
      "住宅",
      "下水道",
      "公園",
      "スポーツ",
      "環境",
      "脱炭素",
      "バリアフリー",
      "トイレ",
      "まち",
    ],
    src: "/images/tag-thumbnails/town-development.jpg",
  },
];

/** 個別キーワード・大分類キーワードのどちらにも当てはまらない場合の最終フォールバック */
const DEFAULT_THUMBNAIL = "/images/tag-thumbnails/town-development.jpg";

/**
 * 質問のテーマ（topicTitles、上から順に優先）からバナー画像を決める。
 * 個別キーワード→大分類キーワード→最終フォールバックの順に見るため、
 * 常に何らかの画像を返す（議案と違って「画像なし」は無し）。
 */
export function getTopicThumbnail(topicTitles: string[] | undefined): string {
  if (!topicTitles || topicTitles.length === 0) return DEFAULT_THUMBNAIL;

  for (const title of topicTitles) {
    for (const rule of TOPIC_KEYWORD_THUMBNAILS) {
      if (rule.keywords.some((keyword) => title.includes(keyword))) {
        return rule.src;
      }
    }
  }

  for (const title of topicTitles) {
    for (const rule of BROAD_CATEGORY_THUMBNAILS) {
      if (rule.keywords.some((keyword) => title.includes(keyword))) {
        return rule.src;
      }
    }
  }

  return DEFAULT_THUMBNAIL;
}
