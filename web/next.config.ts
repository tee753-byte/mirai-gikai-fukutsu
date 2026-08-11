import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // レスポンスヘッダに "X-Powered-By: Next.js" を付けない。
  // 使っているフレームワークを外部に教える必要はないため。
  poweredByHeader: false,
  turbopack: {
    root: "../",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // このサイトを他サイトの<iframe>に埋め込ませない（クリックジャッキング対策）
          { key: "X-Frame-Options", value: "DENY" },
          // ブラウザがContent-Typeを勝手に推測して実行するのを防ぐ
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 他サイトへのリンク先に、閲覧中のURL全体を送らないようにする
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // カメラ・位置情報・マイクなど、このサイトが使わない機能を明示的に無効化
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    // トップの風景写真のような情報量の多い画像はAVIFのほうが大幅に軽い。
    // 対応していないブラウザにはWebPが返る。
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
    ],
  },
};

export default nextConfig;
