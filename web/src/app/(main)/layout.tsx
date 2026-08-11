import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { AuthGate } from "@/components/layouts/auth-gate";
import { Footer } from "@/components/layouts/footer/footer";
import { MainLayout } from "@/components/layouts/main-layout";
import { siteConfig } from "@/config/site.config";
import { env } from "@/lib/env";
import { RubyfulInitializer } from "@/lib/rubyful";

export default function MainGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <SpeedInsights />
      {/*
        Vercelのアクセス解析。どのページが読まれているかを把握するために入れる。
        Cookieを使わず個人を識別しないため、閲覧者に同意を求める必要はない。
        計測を実際に始めるには、Vercelの管理画面でWeb Analyticsを有効にする必要がある。
      */}
      <Analytics />
      {/* IDが未設定の環境（ローカル開発など）で空IDのままスクリプトを読み込まないようにする */}
      {env.analytics.gaTrackingId && (
        <GoogleAnalytics gaId={env.analytics.gaTrackingId} />
      )}
      <RubyfulInitializer />
      {/*
        匿名ユーザーIDの発行はAIチャット・AIインタビュー機能でのみ必要。
        福津版ではどちらも無効のため、無条件で呼ぶとSupabase側で
        匿名サインインを許可していないエラーが毎回発生してしまう。
      */}
      {(siteConfig.features.aiChat || siteConfig.features.aiInterview) && (
        <AuthGate />
      )}

      <MainLayout>
        <Header />
        <main className="min-h-dvh md:min-h-[calc(100dvh-96px)] bg-mirai-surface">
          {children}
        </main>
        <Footer />
      </MainLayout>
    </>
  );
}
