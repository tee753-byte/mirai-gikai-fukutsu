import type { LucideIcon } from "lucide-react";
import { Clock, Home, Landmark, Search, Users } from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * サイト内の主要ページへのリンク。
 * ヘッダーの上部ナビ（PC表示）・ハンバーガーメニュー・フッターで共有している。
 */
export const NAV_LINKS: NavLink[] = [
  { label: "トピックス", href: "/topics", icon: Clock },
  { label: "議案を検索", href: "/search", icon: Search },
  { label: "議会ごとのまとめ", href: "/sessions", icon: Landmark },
  { label: "議員・提出者から見る", href: "/questions/members", icon: Users },
];

/** ハンバーガーメニューではホームへの導線も併せて出す */
export const HAMBURGER_NAV_LINKS: NavLink[] = [
  { label: "ホーム", href: "/", icon: Home },
  ...NAV_LINKS,
];
