/**
 * 構造化データ（JSON-LD）をページに埋め込む部品。
 *
 * 構造化データとは、ページの内容を検索エンジンが機械的に読める形で書いたもの。
 * 見た目には一切出ないが、検索結果に「よくある質問」の折りたたみが出たり、
 * 記事の日付が表示されたりする材料になる。
 *
 * schema.org という共通の語彙を使い、`<script type="application/ld+json">` の
 * 中にJSONとして書く決まりになっている。
 */

type JsonLdProps = {
  /** schema.org の形式に沿ったオブジェクト。`@context` はこの部品が付ける */
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  /*
   * 議案名などのデータに "<" が含まれていると、ブラウザがそこを
   * HTMLタグの始まりと誤解して script タグが途中で終わってしまう。
   * JSONとしては同じ意味になる < に置き換えて防ぐ。
   */
  const json = JSON.stringify({
    "@context": "https://schema.org",
    ...data,
  }).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD は script タグの中に文字列として入れる必要があるため
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
