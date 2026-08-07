import { siteConfig } from "@/config/site.config";
import { resolveBaseUrl } from "./site-url";

/**
 * 構造化データ（JSON-LD）のかたまりを作る関数をまとめたファイル。
 * 出力そのものは `@/components/seo/json-ld` の JsonLd が行う。
 *
 * 構造化データの中のURLは、ページ内のリンクと違って必ず
 * `https://...` から始まる完全な形で書く必要がある。
 */

/** "/topics" のようなパスを "https://例.jp/topics" に直す */
export function toAbsoluteUrl(path: string): string {
  return `${resolveBaseUrl()}${path}`;
}

/**
 * サイト全体の情報。トップページに1つだけ置く。
 * potentialAction を付けておくと、検索結果にこのサイト専用の
 * 検索ボックスが出ることがある（出るかどうかはGoogleの判断）。
 */
export function buildWebSiteSchema() {
  return {
    "@type": "WebSite",
    name: siteConfig.siteName,
    alternateName: `みらい議会 ${siteConfig.cityName}版`,
    url: toAbsoluteUrl("/"),
    description: siteConfig.siteDescription,
    inLanguage: "ja",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: toAbsoluteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * 運営主体の情報。トップページに1つだけ置く。
 * 公式サイトと誤解されないよう、description に非公式である旨を必ず入れる。
 */
export function buildOrganizationSchema() {
  return {
    "@type": "Organization",
    name: siteConfig.siteName,
    url: toAbsoluteUrl("/"),
    logo: toAbsoluteUrl("/icons/pwa/icon_app.svg"),
    description: `${siteConfig.councilName}の議案や一般質問をわかりやすく伝える非公式サイトです。${siteConfig.cityName}・${siteConfig.councilName}が運営する公式サイトではありません。`,
  };
}

/** パンくず（ホーム › 議案 › …）。位置は1から始まる */
export function buildBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

/**
 * 記事1本ぶんの情報（議案の解説・一般質問など）。
 *
 * NewsArticle ではなく Article を使う。NewsArticle は報道機関が出す
 * ニュース記事向けの型で、このサイトは報道機関ではないため。
 */
export function buildArticleSchema(params: {
  headline: string;
  description?: string;
  path: string;
  imageUrl?: string;
  publishedAt?: string;
  modifiedAt?: string;
}) {
  const publisher = {
    "@type": "Organization",
    name: siteConfig.siteName,
    logo: {
      "@type": "ImageObject",
      url: toAbsoluteUrl("/icons/pwa/icon_app.svg"),
    },
  };

  return {
    "@type": "Article",
    headline: params.headline,
    ...(params.description ? { description: params.description } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toAbsoluteUrl(params.path),
    },
    ...(params.imageUrl ? { image: [params.imageUrl] } : {}),
    ...(params.publishedAt ? { datePublished: params.publishedAt } : {}),
    ...(params.modifiedAt ? { dateModified: params.modifiedAt } : {}),
    inLanguage: "ja",
    author: publisher,
    publisher,
  };
}

/** よくあるご質問。回答はプレーンテキストで渡す（HTMLタグは入れない） */
export function buildFaqSchema(items: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
