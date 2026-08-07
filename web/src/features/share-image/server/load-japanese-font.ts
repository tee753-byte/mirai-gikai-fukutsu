import "server-only";

/**
 * シェア画像に使う日本語フォントを取得する。
 *
 * 画像生成（satori）は next/font の仕組みを使えず、フォントの実データが要る。
 * Noto Sans JP は全体だと数MBあり、そのまま同梱すると生成が重くなるので、
 * Google Fonts の `text=` パラメータで「その画像に出てくる文字だけ」に絞って取得する。
 * 1枚あたり数KBで済み、サイト本文（layout.tsx の Noto Sans JP）と書体も揃う。
 */

const FONT_CSS_ENDPOINT = "https://fonts.googleapis.com/css2";

/**
 * Google Fonts は User-Agent を見て返す形式を変える。
 * 最近のブラウザとして問い合わせると woff2 が返ってくるが、
 * satori は woff2 を読めないため、ttf を返す古いブラウザとして問い合わせる。
 */
const TTF_REQUESTING_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13 (KHTML, like Gecko) Chrome/24.0.1290.1 Safari/537.13";

/** フォントは変わらないので長めにキャッシュする（30日） */
const FONT_CACHE_SECONDS = 60 * 60 * 24 * 30;

export type LoadedFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

/**
 * 指定した文字だけを含む Noto Sans JP を取得する。
 * 取得に失敗した場合は null を返す。呼び出し側で共通画像へ退避すること
 * （フォントが無いまま描画すると日本語が豆腐になり、かえって見苦しいため）。
 */
export async function loadJapaneseFont(
  glyphs: string,
  weight: 400 | 700
): Promise<LoadedFont | null> {
  if (!glyphs) {
    return null;
  }

  try {
    const cssUrl = `${FONT_CSS_ENDPOINT}?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(glyphs)}`;

    const cssResponse = await fetch(cssUrl, {
      headers: { "User-Agent": TTF_REQUESTING_USER_AGENT },
      next: { revalidate: FONT_CACHE_SECONDS },
    });

    if (!cssResponse.ok) {
      console.error(
        `フォントCSSの取得に失敗しました: ${cssResponse.status} ${cssUrl}`
      );
      return null;
    }

    const css = await cssResponse.text();
    const fontUrl = extractFontUrl(css);

    if (!fontUrl) {
      console.error("フォントCSSからURLを抽出できませんでした");
      return null;
    }

    const fontResponse = await fetch(fontUrl, {
      next: { revalidate: FONT_CACHE_SECONDS },
    });

    if (!fontResponse.ok) {
      console.error(`フォント本体の取得に失敗しました: ${fontResponse.status}`);
      return null;
    }

    return {
      name: "Noto Sans JP",
      data: await fontResponse.arrayBuffer(),
      weight,
      style: "normal",
    };
  } catch (error) {
    console.error("フォントの取得中にエラーが発生しました", error);
    return null;
  }
}

/** `src: url(https://...) format('truetype')` からURLだけを取り出す */
export function extractFontUrl(css: string): string | null {
  const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)/);
  return match?.[1] ?? null;
}
