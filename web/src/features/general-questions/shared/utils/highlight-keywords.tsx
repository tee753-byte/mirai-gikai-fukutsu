import type { ReactNode } from "react";

/**
 * 文中の検索語に印をつける。
 *
 * 会議録の抜粋は、どこが検索に当たったのかが分からないと読み飛ばされてしまう。
 * 色は特定の言葉を強調するためのものではなく、あくまで「いま検索した語」を
 * 指すためのものなので、検索語以外には使わない。
 */
export function highlightKeywords(text: string, keywords: string[]): ReactNode {
  const targets = keywords.filter((k) => k.length > 0);
  if (targets.length === 0) return text;

  // 正規表現の特殊文字を打ち消してから、いずれかに一致する箇所で分割する
  const pattern = new RegExp(
    `(${targets.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );

  const nodes: ReactNode[] = [];
  // 元の文の何文字目から始まる断片かをキーにする。並びが変わらないため一意になる
  let offset = 0;

  for (const part of text.split(pattern)) {
    const start = offset;
    offset += part.length;
    if (part === "") continue;

    const isMatch = targets.some((k) => k.toLowerCase() === part.toLowerCase());
    if (!isMatch) {
      nodes.push(part);
      continue;
    }
    nodes.push(
      <mark
        key={`hit-${start}`}
        className="rounded-[2px] bg-[var(--color-topic-marker)] px-0.5 font-bold text-mirai-text"
      >
        {part}
      </mark>
    );
  }

  return nodes;
}
