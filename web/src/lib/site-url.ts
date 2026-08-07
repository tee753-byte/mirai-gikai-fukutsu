/**
 * サイトの公開URL（このサイトが外から見えるときのアドレス）を決める。
 *
 * 検索エンジンに伝えるURL（sitemap.xml・robots.txt・canonical・OGP）は
 * すべて同じ値でないといけない。バラバラだと「同じ内容のページが複数ある」と
 * 判断されて検索順位が下がる。そのため決め方をこの1箇所にまとめている。
 *
 * 【URLの決め方】以前は VERCEL_URL を使っていたが、これはデプロイのたびに変わる
 * 長いURL（mirai-gikai-fukutsu-xxxxx.vercel.app）なので、独自ドメインを設定しても
 * 検索エンジンに古いURLを伝え続けてしまう。そのため公開URLを次の順で決める。
 *
 *   1. NEXT_PUBLIC_WEB_URL … 公開URL。独自ドメインを取ったらこれを変える
 *   2. VERCEL_PROJECT_PRODUCTION_URL … 1が未設定のときの保険。Vercelが入れる
 *      本番の代表URL（独自ドメインがあればそれ、無ければプロジェクトの固定URL）
 *   3. localhost … ローカル開発用
 *
 * 末尾のスラッシュは必ず取り除いて返す（`${baseUrl}/topics` のように
 * 連結して使うため、付いていると `//topics` になってしまう）。
 */
export function resolveBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WEB_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) return `https://${vercelProductionUrl}`;

  return "http://localhost:3000";
}
