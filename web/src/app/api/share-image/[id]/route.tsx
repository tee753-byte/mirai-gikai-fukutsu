import { ImageResponse } from "next/og";
import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_DIFFICULTY } from "@/features/bill-difficulty/shared/types";
import { getBillContentWithDifficulty } from "@/features/bills/server/loaders/helpers/get-bill-content";
import { findPublishedBillById } from "@/features/bills/server/repositories/bill-repository";
import { loadJapaneseFont } from "@/features/share-image/server/load-japanese-font";
import {
  SHARE_CARD_DIMENSIONS,
  ShareCard,
  type ShareCardSize,
  shareCardTexts,
} from "@/features/share-image/server/share-card";
import {
  buildShareCardText,
  collectGlyphs,
} from "@/features/share-image/shared/utils/build-share-card-text";
import { siteConfig } from "@/config/site.config";
import { env } from "@/lib/env";

/**
 * 議案ごとのSNSシェア画像を生成する。
 *
 * - `?format=og`（既定）… 1200x630。X・Threads・LINEのカード用。
 *   議案詳細ページの og:image から参照される。
 * - `?format=square` … 1080x1080。Instagram投稿用。
 *   運用者がブラウザで開いて保存し、手で投稿する。
 *
 * 難易度cookieに依存させないため、getBillById ではなくリポジトリを直接呼ぶ。
 * cookieを読むとリクエストごとに結果が変わる扱いになり、キャッシュが効かなくなる。
 */

// フォント取得と画像描画にNode.jsのAPIが要るためEdgeでは動かさない
export const runtime = "nodejs";

/** 生成結果を1日キャッシュする。無料枠のため毎回描き直さない */
export const revalidate = 86400;

function parseSize(value: string | null): ShareCardSize {
  return value === "square" ? "square" : "og";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const size = parseSize(request.nextUrl.searchParams.get("format"));
    const { width, height } = SHARE_CARD_DIMENSIONS[size];

    const [bill, billContent] = await Promise.all([
      findPublishedBillById(id),
      getBillContentWithDifficulty(id, DEFAULT_DIFFICULTY),
    ]);

    if (!bill) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const councilSession = (
      bill as typeof bill & {
        council_sessions: { name: string; slug: string | null } | null;
      }
    ).council_sessions;

    const text = buildShareCardText({
      name: bill.name,
      billNumber: bill.bill_number,
      status: bill.status,
      sessionName: councilSession?.name ?? null,
      contentTitle: billContent?.title ?? null,
    });

    const siteDomain = new URL(env.webUrl).host;
    const texts = shareCardTexts(text, siteConfig.siteName, siteDomain);

    // 描画に出てくる文字だけのフォントを取る。見出しは太字、それ以外は標準
    const [boldFont, regularFont] = await Promise.all([
      loadJapaneseFont(
        collectGlyphs(text.title, text.status, siteConfig.siteName),
        700
      ),
      loadJapaneseFont(collectGlyphs(...texts), 400),
    ]);

    const fonts = [boldFont, regularFont].filter(
      (font): font is NonNullable<typeof font> => font !== null
    );

    // フォントが取れないまま描くと日本語が豆腐（□）になる。
    // それなら共通のOGP画像に退避したほうが見苦しくない。
    if (fonts.length === 0) {
      return NextResponse.redirect(new URL("/ogp.jpg", env.webUrl));
    }

    return new ImageResponse(
      <ShareCard
        text={text}
        size={size}
        siteName={siteConfig.siteName}
        siteDomain={siteDomain}
      />,
      {
        width,
        height,
        fonts: fonts.map((font) => ({
          name: font.name,
          data: font.data,
          weight: font.weight,
          style: font.style,
        })),
      }
    );
  } catch (error) {
    console.error("シェア画像の生成に失敗しました", error);
    return NextResponse.redirect(new URL("/ogp.jpg", env.webUrl));
  }
}
