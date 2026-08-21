"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { DifficultySelector } from "@/features/bill-difficulty/client/components/difficulty-selector";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { InterviewHeaderActions } from "@/features/interview-session/client/components/interview-header-actions";
import { isInterviewPage, isMainPage } from "@/lib/page-layout-utils";
import { HamburgerMenu } from "./hamburger-menu";
import { NAV_LINKS } from "./nav-links";

interface HeaderClientProps {
  difficultyLevel: DifficultyLevelEnum;
}

/**
 * サイト名を「みらい議会」と「＠福津市」に分ける。
 * 下線ではなく「＠地域名」部分の色でシリーズの他地域版と見分けられるようにする
 * （ロゴSVGの配色に合わせている）。区切りが無ければ全体をそのまま返す。
 */
function splitSiteName(name: string): { base: string; area: string | null } {
  const at = name.indexOf("＠");
  if (at === -1) return { base: name, area: null };
  return { base: name.slice(0, at), area: name.slice(at) };
}

export function HeaderClient({ difficultyLevel }: HeaderClientProps) {
  const pathname = usePathname();
  const showDifficultySelector = isMainPage(pathname);
  const showInterviewActions = isInterviewPage(pathname);
  const { base, area } = splitSiteName(siteConfig.siteName);

  return (
    <header className="px-3 fixed top-4 left-0 right-0 z-20 max-w-[1440px] mx-auto">
      <div className="rounded-2xl bg-white shadow-sm mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Site Title */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2"
              aria-label="ホーム"
            >
              {siteConfig.features.showTeamMiraiSection && (
                <Image
                  src="/img/logo.svg"
                  alt={siteConfig.siteName}
                  width={42}
                  height={36}
                />
              )}
              {/* 白ヘッダーのままでも福津市版だと分かるよう、「＠地域名」だけ臙脂にする */}
              <div className="text-xl font-bold">
                {base}
                {area && <span className="text-primary">{area}</span>}
              </div>
            </Link>
          </div>

          {/* Primary nav (PC表示のみ) */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="メインナビゲーション"
          >
            {NAV_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 text-sm font-bold text-mirai-text-secondary hover:text-primary-accent transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Navigation */}
          <nav
            className="flex items-center space-x-2"
            aria-label="補助ナビゲーション"
          >
            {showDifficultySelector && (
              <DifficultySelector currentLevel={difficultyLevel} />
            )}
            {showInterviewActions && <InterviewHeaderActions />}
            <HamburgerMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}
