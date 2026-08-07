import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layouts/not-found-content";

/*
 * 以前はここでトップページへ redirect していたが、それだと存在しないURLに
 * アクセスされたときサーバーが「見つからない（404）」ではなく「移動しました」を
 * 返してしまう。検索エンジンはこれを「ソフト404」と呼んで問題として扱い、
 * 実在しないURLを延々とインデックスしようとしてクロールの効率が落ちる。
 * そのため、リダイレクトはやめて404の画面をそのまま表示する。
 * Next.js は not-found.tsx を描画すると自動で HTTP 404 を返す。
 */

export const metadata: Metadata = {
  title: "ページが見つかりません",
  // 404ページは検索結果に出す必要がないので、登録しないよう伝える
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-mirai-surface">
      <NotFoundContent />
    </main>
  );
}
