/**
 * サイト設定ファイル
 * Fork して別の地方議会向けに使用する場合はこのファイルを変更してください。
 * @see docs/kawasaki/20260304_1000_別地域向けfork手順.md
 * @see docs/fukutsu/20260730_1200_福津版立ち上げ設計書.md
 */
export const siteConfig = {
  siteName: "みらい議会＠福津市",
  siteDescription:
    "福津市議会で今どんな議案が検討されているか、わかりやすく伝えるプラットフォームです",
  cityName: "福津市",
  councilName: "福津市議会",
  keywords: [
    "みらい議会＠福津市",
    "議案",
    "福津市",
    "市議会",
    "地方政治",
    "政策",
    "解説",
  ],
  councilBaseUrl: "https://www.city.fukutsu.lg.jp/",
  /** このサイトのソースコード（フッター等からリンク） */
  githubUrl: "https://github.com/tee753-byte/mirai-gikai-fukutsu",
  /** 議案・議決結果の一覧ページ（福津市議会「議会の日程と議決結果」） */
  councilBillsDetailUrl:
    "https://www.city.fukutsu.lg.jp/gikai/nittei/index.html",
  twitterHashtag: "みらい議会福津市版", // # なし
  /**
   * トップページ最上部の背景画像。
   * 地域の風景に差し替えるときはこのパスだけを変える。
   * 写真を使う場合は、必ず利用許諾を確認したものを web/public/img/ に置くこと。
   */
  heroImage: "/img/hero_miyajidake.jpg",
  externalLinks: {
    report: "https://forms.gle/aJuYZxKqtrRHtVwH9",
    aboutNote: "",
    donation: "https://team-mir.ai/support/donation",
    teamAbout: "https://team-mir.ai/about",
    terms: "https://team-mir.ai/terms",
    privacy: "https://team-mir.ai/privacy",
    faq: "https://team-mirai.notion.site/FAQ-28cf6f56bae180bd84e7f7ae80f806a1",
  },
  /**
   * ページを管理する政党名（空文字列の場合は政党名を省略した汎用表現を使用）
   * 例: "チームみらい"
   */
  managingParty: "" as string,
  /**
   * サービス運営者情報
   * 利用規約や問い合わせ先に使用します。
   */
  operator: {
    name: "tee" as string,
    contactUrl: "https://forms.gle/aJuYZxKqtrRHtVwH9" as string,
    /** 利用規約の準拠法・管轄裁判所（第一審の専属的合意管轄） */
    jurisdiction: "福岡地方裁判所" as string,
  },
  /**
   * AI機能の有効/無効設定
   * 本番環境のコスト管理のため、機能ごとにオン/オフを切り替えられます。
   */
  features: {
    /** AIチャット機能（議案への質問・テキスト選択からの質問）*/
    aiChat: false,
    /** AIインタビュー機能（議案当事者へのヒアリング）*/
    aiInterview: false,
    /**
     * チームみらいセクションの表示（トップページ・フッター・デスクトップメニュー）
     * 非公式運営など、党の公式サービスとして出さない場合は false にする。
     */
    showTeamMiraiSection: false as boolean,
    /**
     * 予算の見える化（トップページのバナー・予算ページへの導線）
     * 令和8年3月定例会分は防災関連5事業のみのプロトタイプ（全40事業中）。
     * ※バナーは予算データの有無を見ないため、データが無い間は false にする。
     */
    showBudget: true as boolean,
  },
} as const;

// 公開前に値を入れ忘れると気づきにくい項目のガード。
// 本番ビルド時にだけ検査し、ローカル開発中は未設定のままでも動かせるようにする。
if (process.env.NODE_ENV === "production") {
  const missingFields: string[] = [];
  if (!siteConfig.externalLinks.report)
    missingFields.push("externalLinks.report");
  if (!siteConfig.operator.contactUrl)
    missingFields.push("operator.contactUrl");
  if (missingFields.length > 0) {
    throw new Error(
      `公開前必須の設定が未設定です: ${missingFields.join(", ")}（web/src/config/site.config.ts）`
    );
  }
}
