import { siteConfig } from "@/config/site.config";

/**
 * このサイト自身のSNSアカウント（フッター等で表示する順番・アイコン）。
 *
 * URLは `site.config.ts` の `siteConfig.sns` を参照する（ここには書かない）。
 * これは政党「チームみらい」本体のアカウント一覧（`@/lib/social-links`）とは別物。
 * 混同すると党の公式アカウントへ誘導してしまうため、必ずこちらを使うこと。
 */
export type SiteSnsLink = {
  key: string;
  name: string;
  url: string;
  iconPath: string;
  /** アイコン画像自体に背景色が無く、境界線を足さないと見えにくいもの */
  hasBorder: boolean;
};

export const SITE_SNS_LINKS: SiteSnsLink[] = [
  {
    key: "x",
    name: "X",
    url: siteConfig.sns.x,
    iconPath: "/icons/sns/icon_x.png",
    hasBorder: false,
  },
  {
    key: "instagram",
    name: "Instagram",
    url: siteConfig.sns.instagram,
    iconPath: "/icons/sns/icon_instagram.png",
    hasBorder: true,
  },
  {
    key: "threads",
    name: "Threads",
    url: siteConfig.sns.threads,
    iconPath: "/icons/sns/icon_threads.png",
    hasBorder: true,
  },
  {
    key: "facebook",
    name: "Facebook",
    url: siteConfig.sns.facebook,
    iconPath: "/icons/sns/icon_facebook.png",
    hasBorder: false,
  },
];
