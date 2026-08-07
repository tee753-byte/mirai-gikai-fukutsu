import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layouts/not-found-content";

/*
 * 議案・議員・会期などが見つからず、ページ側で notFound() を呼んだときに出る画面。
 * こちらは (main) の中にあるので、ヘッダーとフッターが付いた状態で表示される。
 * どのページにも当てはまらないURLの場合は app/not-found.tsx のほうが使われる。
 */

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false, follow: true },
};

export default function MainNotFound() {
  return <NotFoundContent />;
}
