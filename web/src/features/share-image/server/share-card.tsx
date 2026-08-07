import "server-only";
import type { ShareCardText } from "../shared/utils/build-share-card-text";

/**
 * SNSシェア用カードの描画。
 *
 * 画像生成（satori）は Tailwind もCSS変数も解釈できないため、
 * ここだけは例外的にインラインスタイルと色コードを直接書く。
 * 色は globals.css の `@theme inline` と同じ値を使うこと。
 * ずれるとサイト本体とシェア画像で見た目が食い違う。
 */
const COLORS = {
  /** --background */
  background: "#f7f4ee",
  /** --primary */
  primary: "#701a1a",
  /** --color-mirai-text */
  text: "#1f2937",
  /** --color-mirai-text-subtle */
  textSubtle: "#666666",
  /** --primary-foreground 相当（白） */
  onPrimary: "#ffffff",
  /** --color-mirai-surface-warm */
  surfaceWarm: "#eae6dd",
} as const;

export type ShareCardSize = "og" | "square";

export const SHARE_CARD_DIMENSIONS: Record<
  ShareCardSize,
  { width: number; height: number }
> = {
  /** X・Threads・LINEのカード用 */
  og: { width: 1200, height: 630 },
  /** Instagram投稿用 */
  square: { width: 1080, height: 1080 },
};

type ShareCardProps = {
  text: ShareCardText;
  size: ShareCardSize;
  /** カード下部に出すサイト名 */
  siteName: string;
  /** カード下部に出すドメイン（例: "mirai-gikai-fukutsu.example"） */
  siteDomain: string;
};

export function ShareCard({
  text,
  size,
  siteName,
  siteDomain,
}: ShareCardProps) {
  const { width, height } = SHARE_CARD_DIMENSIONS[size];

  // 正方形は縦に余裕があるので、見出しを大きくして余白も広く取る
  const isSquare = size === "square";
  const padding = isSquare ? 80 : 72;
  // 正方形は縦に余裕があるぶん見出しを大きく取る。
  // スマホのタイムラインでは小さく表示されるため、文字は大きいほうが読まれる
  const titleFontSize = isSquare ? 84 : 60;
  const metaFontSize = isSquare ? 32 : 28;
  const footerFontSize = isSquare ? 30 : 26;
  const accentWidth = isSquare ? 20 : 16;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        backgroundColor: COLORS.background,
        fontFamily: '"Noto Sans JP"',
      }}
    >
      {/* 左端のアクセント帯。サイトのブランドカラーで一目で判別できるようにする */}
      <div
        style={{
          width: accentWidth,
          height: "100%",
          backgroundColor: COLORS.primary,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          padding,
        }}
      >
        {/* 上段: 議案番号と定例会名 */}
        <div
          style={{
            display: "flex",
            fontSize: metaFontSize,
            color: COLORS.textSubtle,
            letterSpacing: "0.02em",
          }}
        >
          {text.meta}
        </div>

        {/* 中段: 議案の見出し。
            見出しの長さで上下の余白が偏らないよう、残りの高さを占めて縦中央に置く */}
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            alignItems: "center",
            fontSize: titleFontSize,
            fontWeight: 700,
            color: COLORS.text,
            lineHeight: 1.4,
            paddingTop: isSquare ? 40 : 24,
            paddingBottom: isSquare ? 40 : 24,
          }}
        >
          {text.title}
        </div>

        {/* 下段: 審議状況とサイト名 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: COLORS.primary,
              color: COLORS.onPrimary,
              fontSize: footerFontSize,
              fontWeight: 700,
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 32,
              paddingRight: 32,
              borderRadius: 999,
            }}
          >
            {text.status}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: footerFontSize,
                fontWeight: 700,
                color: COLORS.text,
              }}
            >
              {siteName}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: footerFontSize - 6,
                color: COLORS.textSubtle,
                paddingTop: 6,
              }}
            >
              {siteDomain}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** カードに描画される全テキスト。フォントの絞り込みに使う */
export function shareCardTexts(
  text: ShareCardText,
  siteName: string,
  siteDomain: string
): string[] {
  return [text.title, text.meta, text.status, siteName, siteDomain];
}

export { COLORS as SHARE_CARD_COLORS };
