import type { MetadataRoute } from "next";

/**
 * robots.txt（検索エンジンのロボットへの案内）。
 *
 * 検索エンジンは自動プログラム（クローラー）でページを読みに来る。
 * このファイルは「どこを読んでよいか」「サイトマップはどこか」を伝えるもの。
 *
 * 方針: 市民に届けたいサイトなので、原則すべて読んでもらう。
 * ただし、検索結果に出しても意味がない画面だけ除外する。
 *
 * なお公開前はBasic認証で全体を保護しているため、そもそもクローラーは
 * 中に入れない（401が返る）。認証を外した時点でこの内容が効き始める。
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_WEB_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // 検索結果の一覧そのもの。条件の組み合わせで無数のURLができるため、
        // 検索エンジンに登録させると同じ内容のページが大量に並んでしまう
        "/search?",
        // 開発用のUI確認ページ（本番では404だが念のため）
        "/dev/",
        // 内部プレビュー・管理用
        "/preview/",
        "/api/",
      ],
    },
    sitemap: `${baseUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
