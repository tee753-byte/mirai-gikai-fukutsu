import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Lexend_Giga, Noto_Sans_JP } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { siteConfig } from "@/config/site.config";
import type { ReactNode } from "react";
import { resolveBaseUrl } from "@/lib/site-url";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const lexendGiga = Lexend_Giga({
  variable: "--font-lexend-giga",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
});

const ogImage = {
  url: "/ogp.jpg",
  width: 1200,
  height: 630,
  alt: `${siteConfig.siteName}のOGPイメージ`,
};

export const metadata: Metadata = {
  metadataBase: new URL(resolveBaseUrl()),
  /*
   * title.template は「各ページが指定したタイトルの後ろに、自動でサイト名を足す」設定。
   * これが無いと、ページごとに `| みらい議会＠福津市` を手書きすることになり、
   * 付いているページと付いていないページが混ざる（実際に混ざっていた）。
   * default はトップページのように自分でタイトルを指定しないページに使われる。
   */
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.siteDescription,
  keywords: [...siteConfig.keywords],
  icons: {
    icon: "/icons/pwa/icon_app.svg",
    apple: "/icons/pwa/icon_app.svg",
  },
  manifest: "/manifest.json",
  /*
   * canonical（正規URL）は「このページの正式なアドレスはこれです」と検索エンジンに
   * 伝えるもの。同じ内容に複数のURLで到達できるとき（末尾スラッシュの有無、
   * 旧ドメイン、クエリ付きなど）に評価が分散するのを防ぐ。
   */
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    title: siteConfig.siteName,
    description: siteConfig.siteDescription,
    images: [ogImage],
    siteName: siteConfig.siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.siteName,
    description: siteConfig.siteDescription,
    images: [ogImage.url],
  },
  /*
   * Google Search Console（検索での見え方を確認する無料ツール）に
   * 「このサイトの持ち主です」と証明するための印。Vercelの環境変数に
   * NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION を入れると <meta> が出力される。
   * 未設定なら何も出ないので、ローカルでは空のままでよい。
   */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#701a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${lexendGiga.variable} font-sans antialiased bg-mirai-surface-light`}
      >
        <NextTopLoader showSpinner={false} color="#701a1a" />
        {children}
      </body>
    </html>
  );
}
