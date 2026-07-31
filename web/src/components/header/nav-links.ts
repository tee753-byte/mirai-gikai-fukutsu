import type { LucideIcon } from "lucide-react";
import { Home, Info, Landmark, Users } from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * サイト内の主要ページへのリンク。ヘッダーの上部ナビ（PC表示）とハンバーガーメニューの両方で使う。
 * 「議案を検索」は検索機能自体が未実装のため、作るまでは含めない。
 */
export const NAV_LINKS: NavLink[] = [
  { label: "議会ごとのまとめ", href: "/sessions", icon: Landmark },
  { label: "議員・提出者から見る", href: "/questions/members", icon: Users },
  { label: "みらい議会とは", href: "/#about", icon: Info },
];

/** ハンバーガーメニューではホームへの導線も併せて出す */
export const HAMBURGER_NAV_LINKS: NavLink[] = [
  { label: "ホーム", href: "/", icon: Home },
  ...NAV_LINKS,
];
