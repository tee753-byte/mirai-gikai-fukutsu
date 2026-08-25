import { describe, expect, it } from "vitest";
import {
  type Blob,
  classifyMark,
  cluster,
  findBlobs,
  type GrayImage,
  nearestIndex,
  parsePgm,
} from "./parse-gikaidayori-marks";

/** 白地に図形を描いた小さな画像をつくる */
function canvas(width: number, height: number): GrayImage {
  return { width, height, pixels: new Uint8Array(width * height).fill(255) };
}

function drawCircle(
  img: GrayImage,
  cx: number,
  cy: number,
  radius: number,
  filled: boolean
) {
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const on = filled ? d <= radius : d <= radius && d >= radius - 1.5;
      if (on) img.pixels[y * img.width + x] = 0;
    }
  }
}

function drawDash(img: GrayImage, cx: number, cy: number, halfWidth: number) {
  for (let x = cx - halfWidth; x <= cx + halfWidth; x++) {
    for (let y = cy - 1; y <= cy + 1; y++) {
      img.pixels[y * img.width + x] = 0;
    }
  }
}

const WHOLE = (img: GrayImage) => ({
  x0: 0,
  y0: 0,
  x1: img.width,
  y1: img.height,
});

function readOne(img: GrayImage): { blob: Blob; kind: string } {
  const { blobs, dark, width } = findBlobs(img, WHOLE(img));
  expect(blobs).toHaveLength(1);
  const isDark = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && dark[y * width + x] === 1;
  return { blob: blobs[0], kind: classifyMark(blobs[0], isDark) };
}

describe("classifyMark", () => {
  it("塗りつぶした丸を反対と読む", () => {
    const img = canvas(30, 30);
    drawCircle(img, 15, 15, 10, true);
    expect(readOne(img).kind).toBe("反対");
  });

  it("輪郭だけの丸を賛成と読む", () => {
    const img = canvas(30, 30);
    drawCircle(img, 15, 15, 10, false);
    expect(readOne(img).kind).toBe("賛成");
  });

  it("横棒を欠席と読む", () => {
    const img = canvas(30, 30);
    drawDash(img, 15, 15, 9);
    expect(readOne(img).kind).toBe("欠席");
  });
});

describe("findBlobs", () => {
  it("離れた図形をそれぞれ別の塊として拾う", () => {
    const img = canvas(60, 30);
    drawCircle(img, 12, 15, 8, true);
    drawCircle(img, 45, 15, 8, false);

    const { blobs } = findBlobs(img, WHOLE(img));
    expect(blobs).toHaveLength(2);
    const centers = blobs.map((b) => Math.round(b.cx)).sort((a, b) => a - b);
    expect(centers[0]).toBeCloseTo(12, 0);
    expect(centers[1]).toBeCloseTo(45, 0);
  });
});

describe("parsePgm", () => {
  it("P5のヘッダと画素を読む", () => {
    const body = Buffer.from([0, 128, 255, 10]);
    const img = parsePgm(Buffer.concat([Buffer.from("P5\n2 2\n255\n"), body]));
    expect(img.width).toBe(2);
    expect(img.height).toBe(2);
    expect(Array.from(img.pixels)).toEqual([0, 128, 255, 10]);
  });

  it("P5でなければ例外にする", () => {
    expect(() => parsePgm(Buffer.from("P3\n1 1\n255\n"))).toThrow(/P5/);
  });
});

describe("cluster / nearestIndex", () => {
  it("近い値をまとめて中心を出す", () => {
    expect(cluster([10, 11, 30, 31, 32], 5)).toEqual([10.5, 31]);
  });

  it("いちばん近い位置を返す", () => {
    expect(nearestIndex([0, 10, 20], 12)).toBe(1);
  });
});
