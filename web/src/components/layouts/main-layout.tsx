"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site.config";
import { isInterviewSection, isMainPage } from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const useSidebarLayout = isMainPage(pathname) && siteConfig.features.aiChat;
  const isInterview = isInterviewSection(pathname);

  /*
   * ヘッダーは画面に固定で浮いている（fixed top-4 ＋ 高さ64px）ため、
   * その分を空けないと本文の先頭がヘッダーの下に隠れる。
   * PCでは md:mt-24 で空けていたが、スマホでは何も空いておらず、
   * TOP以外のページで見出しがヘッダーに重なっていた。
   *
   * TOPページだけは、ヘッダーがトップ画像の上に重なって見えるのが
   * 意図した見た目なので、余白を入れない。
   */
  const isTopPage = pathname === "/";

  return (
    <div
      className={cn(
        "relative max-w-[700px] mx-auto md:mt-24",
        !isTopPage && "mt-24",
        // インタビューページ以外ではshadowを表示
        !isInterview && "sm:shadow-lg",
        // TOPページと法案詳細ページのみ、チャットサイドバー用のオフセット
        useSidebarLayout && "pc:mr-[500px] xl:ml-[calc(calc(100vw-1180px)/2)]"
      )}
    >
      {children}
    </div>
  );
}
