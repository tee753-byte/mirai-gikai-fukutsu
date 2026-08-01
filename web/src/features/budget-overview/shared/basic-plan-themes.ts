/**
 * 福津市「まちづくり基本構想」の7つのテーマ。
 * 「主要事業の概要」PDFでは、事業ごとに「テーマ別目標像」としてこの7分類のいずれかが
 * 付けられている。予算の事業カードのタグとして使う。
 *
 * 出典: 福津市 令和8年度 主要事業の概要（各事業の調書に記載の「テーマ別目標像」欄）
 */
export type BasicPlanTheme = {
  /** budget_initiatives.basic_plan_theme に入れる値 */
  key: string;
  label: string;
};

export const BASIC_PLAN_THEMES: BasicPlanTheme[] = [
  { key: "kyoiku", label: "共育：誰もが「未来の創り手」として育つまち" },
  { key: "chiiki-jichi", label: "地域自治：人がつながり活躍する共助のまち" },
  { key: "kenko", label: "健康：健康で生き生きと暮らせるまち" },
  {
    key: "anzen-anshin",
    label: "安全安心：安全・安心・快適に住み続けられるまち",
  },
  {
    key: "kankyo-hozen",
    label: "環境保全：自然・歴史・景観などの資源が守られ生かされるまち",
  },
  { key: "chiiki-sangyo", label: "地域産業：地域の産業が経済を支えるまち" },
  {
    key: "kanko-shinko",
    label: "観光振興：福津の魅力を生かした持続可能な観光のまち",
  },
  // 7つのテーマとは別枠で、財源確保や計画推進など土台にあたる事業に付けられている区分。
  // 原本の表記は「8．まちづくり計画推進にあたっての基本的な考え方」で、
  // タグに出すと長すぎるため「計画推進」を頭に付けて短く表示できるようにしている
  {
    key: "keikaku-suishin",
    label: "計画推進：まちづくり計画推進にあたっての基本的な考え方",
  },
];
