import Link from "next/link";
import { Container } from "./container";

/**
 * ページが見つからないときの本文。
 *
 * 同じ内容を2箇所から使う。
 *  - `app/not-found.tsx` … どのページにも当てはまらないURLを開いたとき
 *  - `app/(main)/not-found.tsx` … 議案や議員が見つからず notFound() を呼んだとき
 *    （こちらはヘッダー・フッター付きで表示される）
 */
export function NotFoundContent() {
  return (
    <Container className="py-20 md:py-28">
      <div className="flex flex-col items-start gap-4 max-w-xl">
        <p className="font-bold text-sm text-primary-accent">404</p>
        <h1 className="text-2xl font-bold text-mirai-text">
          ページが見つかりませんでした
        </h1>
        <p className="text-sm leading-relaxed text-mirai-text-secondary">
          アドレスが変わったか、削除された可能性があります。
          お探しの議案や一般質問は、検索から見つけられるかもしれません。
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            トップページへ
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full border border-mirai-border-light px-5 py-2 text-sm font-medium text-mirai-text transition-colors hover:bg-muted/50"
          >
            議案・質問を検索する
          </Link>
        </div>
      </div>
    </Container>
  );
}
