/**
 * 賛否表の○●が「文字」ではなく「図形」で描かれている号を読み取る。
 *
 * 【なぜ別の仕組みが要るのか】
 * 82号は○●がそのまま文字として入っていたため parse-gikaidayori-votes.ts で
 * 読めた。86号は議員名・案件名・議決結果は文字として入っているのに、
 * ○●だけが図形で描かれており、PDF全体を検索しても○●は凡例の3つしか出てこない。
 * そこでページを画像にして、記号の形をピクセルから判定する。
 *
 * 【判定のしかた】記号1つが1つの黒い塊になるので、塊ごとに次を見る。
 *   ・平たい（高さ÷幅が小さい）        → ー（欠席）
 *   ・中心が黒い                        → ●（反対）
 *   ・中心が白い（輪郭だけ黒い）        → ○（賛成）
 * ＊（棄権）は82号・86号には出てこないため扱っていない。出てきた号があれば、
 * 中心が黒く輪郭が無いことで●と区別する必要がある。
 */

/** pdftoppm -gray が出す PGM（P5）を読む */
export type GrayImage = {
  width: number;
  height: number;
  /** 0=黒 255=白 */
  pixels: Uint8Array;
};

export function parsePgm(buf: Buffer): GrayImage {
  let pos = 0;
  const token = (): string => {
    while (pos < buf.length && buf[pos] <= 32) pos++;
    if (buf[pos] === 0x23) {
      while (pos < buf.length && buf[pos] !== 10) pos++;
      return token();
    }
    let s = "";
    while (pos < buf.length && buf[pos] > 32) s += String.fromCharCode(buf[pos++]);
    return s;
  };

  const magic = token();
  if (magic !== "P5") throw new Error(`PGM(P5)ではありません: ${magic}`);
  const width = Number(token());
  const height = Number(token());
  const max = Number(token());
  if (max !== 255) throw new Error(`想定外の最大値です: ${max}`);
  pos++; // ヘッダ末尾の空白1文字

  return { width, height, pixels: buf.subarray(pos, pos + width * height) };
}

export type Blob = {
  /** 黒画素の数 */
  size: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
};

/**
 * 指定した範囲の黒い塊を拾う。
 * 範囲は記号だけが入るように呼び出し側で絞っておくこと（案件名や注記が入ると塊が増える）。
 */
export function findBlobs(
  image: GrayImage,
  region: { x0: number; y0: number; x1: number; y1: number },
  threshold = 140
): { blobs: Blob[]; dark: Uint8Array; width: number; height: number } {
  const w = region.x1 - region.x0;
  const h = region.y1 - region.y0;
  const dark = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      dark[y * w + x] =
        image.pixels[(y + region.y0) * image.width + (x + region.x0)] < threshold
          ? 1
          : 0;
    }
  }

  const seen = new Uint8Array(w * h);
  const blobs: Blob[] = [];
  const stack: number[] = [];

  for (let start = 0; start < dark.length; start++) {
    if (!dark[start] || seen[start]) continue;
    seen[start] = 1;
    stack.push(start);
    let size = 0;
    let sx = 0;
    let sy = 0;
    let minx = Infinity;
    let maxx = -Infinity;
    let miny = Infinity;
    let maxy = -Infinity;

    while (stack.length > 0) {
      const p = stack.pop() as number;
      const y = Math.floor(p / w);
      const x = p % w;
      size++;
      sx += x;
      sy += y;
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (dark[q] && !seen[q]) {
            seen[q] = 1;
            stack.push(q);
          }
        }
      }
    }

    blobs.push({
      size,
      cx: sx / size,
      cy: sy / size,
      width: maxx - minx + 1,
      height: maxy - miny + 1,
    });
  }

  return { blobs, dark, width: w, height: h };
}

export type MarkKind = "賛成" | "反対" | "欠席";

/**
 * 塊1つを記号に読み替える。
 *
 * `isDark(x, y)` は塊が乗っている面の黒白を返す関数。塊の中心付近が
 * どれだけ黒いかで、塗りつぶし（●）と輪郭だけ（○）を分ける。
 */
export function classifyMark(
  blob: Blob,
  isDark: (x: number, y: number) => boolean
): MarkKind {
  // ーは横に平たい。○●はほぼ正方形に収まる
  if (blob.height / blob.width < 0.35) return "欠席";

  const radius = Math.max(2, Math.round(Math.min(blob.width, blob.height) * 0.22));
  let dark = 0;
  let total = 0;
  const cx = Math.round(blob.cx);
  const cy = Math.round(blob.cy);
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      total++;
      if (isDark(x, y)) dark++;
    }
  }

  return dark / total > 0.6 ? "反対" : "賛成";
}

/** 近い値どうしをまとめて、列（行）の中心を出す */
export function cluster(values: number[], gap: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const v of sorted) {
    const last = groups[groups.length - 1];
    if (last && v - last[last.length - 1] <= gap) last.push(v);
    else groups.push([v]);
  }
  return groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
}

export function nearestIndex(values: number[], target: number): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (Math.abs(values[i] - target) < Math.abs(values[best] - target)) best = i;
  }
  return best;
}
