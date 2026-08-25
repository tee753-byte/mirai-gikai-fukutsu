/**
 * 市議会だよりPDF（○●が図形で描かれている号）→ 議員別の賛否JSON を作る。
 *
 * 使い方:
 *   cd packages/seed
 *   npx tsx fukutsu/build-member-votes-image.ts "<賛否表ページのPDF>" \
 *     --split "4月臨時会=r8-4,6月定例会=r8-6"
 *
 * 事前に poppler の pdftotext・pdftoppm が要る（MSYS付属のxpdf版ではなく、
 * 日本語を読める poppler のものを使うこと）。
 * PDFそのものはリポジトリに入れず、出来上がった data/<slug>-votes.json だけを置く。
 *
 * 【文字だけの号との違い】82号は○●が文字だったので build-member-votes.ts で
 * 読めた。86号は議員名・案件名・議決結果は文字なのに○●だけが図形で、PDFを
 * 検索しても○●は凡例の3つしか出てこない。そこで格子の位置は文字から決め、
 * 記号の形だけを画像から読む（parse-gikaidayori-marks.ts）。
 *
 * 【表のどこを手がかりにするか】号がかわっても崩れにくい順に辿る。
 *   1. 「公開します。みんなの賛成と反対」… 賛否表の見出し。ここから下が表
 *   2. 議決結果の語（可決・否決・承認…）… いちばん左の列。1行に1つ出る
 *   3. 見出しと最初の議決結果のあいだにある語 … 議員名（縦書きで姓と名に分かれる）
 *   4. 「○は賛成」… 凡例。ここから上までが表
 *
 * 【会期の分かれ目】1つの号に複数の会期が載ることがある（86号は4月臨時会と
 * 6月定例会）。表の中の小見出しのy座標を境に行を振り分け、会期ごとに書き出す。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyMark,
  cluster,
  findBlobs,
  nearestIndex,
  parsePgm,
} from "./parse-gikaidayori-marks";
import { type BBoxWord, parseBBoxWords } from "./parse-gikaidayori-votes";

/** 画像化するときの解像度。記号1つが20px程度になり、形の判定に十分な細かさ */
const DPI = 300;

/** 議決結果として現れる語 */
const RESULT_RE =
  /^(可決|否決|承認|不承認|同意|不同意|採択|不採択|認定|認定しない)$/;

function run(cmd: string, args: string[]): void {
  execFileSync(cmd, args, { stdio: ["ignore", "ignore", "inherit"] });
}

function need<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

/**
 * 等間隔に並んでいる列だけを取り出す。
 *
 * 見開きのページでは、議員名と同じ高さに隣のページの本文が入ってくる。
 * 議員名の列は必ず等間隔なので、間隔のそろった最長の並びを選べば本文を
 * 巻き込まずに済む。本文の列が議員名のあいだに割り込むこともあるため、
 * 隣どうしに限らず、間隔が合う値を飛ばしながら拾う。
 */
function longestEvenRun(values: number[], tolerance = 0.15): number[] {
  if (values.length < 3) return values;

  let best: number[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    for (let j = i + 1; j < values.length; j++) {
      const gap = values[j] - values[i];
      if (gap <= 0) continue;
      const run = [values[i]];
      let current = values[i];
      for (;;) {
        const next = values.find(
          (v) => v > current && Math.abs(v - (current + gap)) <= gap * tolerance
        );
        if (next === undefined) break;
        run.push(next);
        current = next;
      }
      if (run.length > best.length) best = run;
    }
  }
  return best;
}

/** 縦書きで姓と名に分かれた議員名を、x座標ごとにつなげる */
function readMemberNames(
  words: BBoxWord[],
  fromY: number,
  toY: number
): { x: number; name: string }[] {
  const nameWords = words.filter((w) => w.y0 > fromY && w.y0 < toY);
  const columns = longestEvenRun(
    cluster(
      nameWords.map((w) => w.x0),
      4
    )
  );

  return columns.map((x) => ({
    x,
    name: nameWords
      .filter((w) => Math.abs(w.x0 - x) <= 4)
      .sort((a, b) => a.y0 - b.y0)
      .map((w) => w.text)
      .join("")
      .replace(/[\s　]/g, ""),
  }));
}

/**
 * 案件名を行ごとに組み立てる。
 * 長い案件名は折り返されて複数の語に分かれるので、その行の議決結果の高さから
 * 次の行の議決結果の手前までを、ひとつの案件名として連結する。
 */
function readTitles(
  words: BBoxWord[],
  results: BBoxWord[],
  titleX: number,
  markLeft: number,
  bottomY: number
): string[] {
  const titleWords = words
    .filter((w) => w.x0 >= titleX - 3 && w.x1 < markLeft && w.y0 < bottomY)
    .sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);

  return results.map((result, i) => {
    const next = results[i + 1];
    const from = result.y0 - 6;
    const to = next ? next.y0 - 6 : bottomY;
    return titleWords
      .filter((w) => w.y0 >= from && w.y0 < to)
      .map((w) => w.text)
      .join("");
  });
}

function normalizeDigits(s: string): string {
  return s.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
}

function main() {
  const argv = process.argv.slice(2);
  const pdfPath = argv[0];
  const splitArg = argv[argv.indexOf("--split") + 1];
  if (!pdfPath || !argv.includes("--split") || !splitArg) {
    console.error(
      'usage: npx tsx fukutsu/build-member-votes-image.ts "<PDF>" --split "4月臨時会=r8-4,6月定例会=r8-6"'
    );
    process.exit(1);
  }
  const split = splitArg.split(",").map((pair) => {
    const [label, slug] = pair.split("=");
    return { label, slug };
  });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gikaidayori-"));
  run("pdftotext", ["-bbox-layout", pdfPath, path.join(tmp, "bbox.xml")]);
  run("pdftoppm", ["-r", String(DPI), "-gray", pdfPath, path.join(tmp, "page")]);

  const pgmFile = need(
    fs.readdirSync(tmp).filter((f) => f.endsWith(".pgm")).sort()[0],
    "PDFを画像にできませんでした"
  );
  const words = parseBBoxWords(fs.readFileSync(path.join(tmp, "bbox.xml"), "utf8"));
  const image = parsePgm(fs.readFileSync(path.join(tmp, pgmFile)));

  // 1. 賛否表の見出し
  const heading = need(
    words.find((w) => w.text.includes("公開します")),
    "賛否表の見出し『公開します。みんなの賛成と反対』が見つかりません"
  );
  // 4. 凡例（表の下端）
  const legend = need(
    words.find((w) => w.text.includes("は賛成") && w.y0 > heading.y0),
    "凡例『○は賛成』が見つかりません"
  );
  // 2. 議決結果（左端の列）。表の中にあるものだけ
  const results = words
    .filter(
      (w) => RESULT_RE.test(w.text) && w.y0 > heading.y1 && w.y0 < legend.y0
    )
    .sort((a, b) => a.y0 - b.y0);
  if (results.length === 0) throw new Error("議決結果の列が見つかりません");

  // 3. 見出しと最初の議決結果のあいだにあるのが議員名。
  //    見出しは左端にあって縦に大きいため、下端(y1)で切ると姓の段が外れる。上端(y0)で切る
  const members = readMemberNames(words, heading.y0, results[0].y0);
  if (members.length < 2) throw new Error("議員名を読み取れませんでした");

  const pitch =
    (members[members.length - 1].x - members[0].x) / (members.length - 1);
  const pageWidth = Math.max(...words.map((w) => w.x1)) > 900 ? 1190.55 : 595.276;
  const scale = image.width / pageWidth;
  const toPx = (pt: number) => Math.round(pt * scale);

  // 記号が並ぶ範囲。議長の列（いちばん右）は表決に参加せず記号が無いので外す
  const markLeft = members[0].x - pitch * 0.5;
  const region = {
    x0: toPx(markLeft),
    y0: toPx(results[0].y0 - pitch),
    x1: toPx(members[members.length - 1].x - pitch * 0.5),
    y1: toPx(legend.y0 - 2),
  };

  const { blobs, dark, width: rw } = findBlobs(image, region);
  const isDark = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < rw && dark[y * rw + x] === 1;

  const markSize = pitch * scale;
  const marks = blobs.filter(
    (b) =>
      b.width >= markSize * 0.35 &&
      b.width <= markSize * 1.2 &&
      b.height <= markSize * 1.2 &&
      b.size >= 15
  );

  const colX = cluster(
    marks.map((b) => b.cx),
    markSize * 0.5
  );
  const rowY = cluster(
    marks.map((b) => b.cy),
    markSize * 0.5
  );
  if (colX.length + 1 !== members.length) {
    throw new Error(
      `議員の人数と記号の列数が合いません: 議員${members.length}人（うち議長1人） 記号${colX.length}列`
    );
  }
  if (rowY.length !== results.length) {
    throw new Error(
      `議決結果の数と記号の行数が合いません: ${results.length} vs ${rowY.length}`
    );
  }

  const grid: (string | null)[][] = rowY.map(() => colX.map(() => null));
  for (const b of marks) {
    const r = nearestIndex(rowY, b.cy);
    const c = nearestIndex(colX, b.cx);
    const kind = classifyMark(b, isDark);
    if (grid[r][c] && grid[r][c] !== kind) {
      throw new Error(`同じマスに違う記号が出ました: 行${r + 1} 列${c + 1}`);
    }
    grid[r][c] = kind;
  }

  const titleX = Math.min(...words.filter((w) => w.x1 < markLeft).map((w) => w.x0));
  const titles = readTitles(words, results, titleX + 20, markLeft, legend.y0);

  // 表の中の会期の小見出し（例:「4月臨時会」）。行をどの会期に振り分けるかの境目
  const headings = split
    .map(({ label, slug }) => {
      const w = need(
        words.find(
          (word) =>
            word.x1 < markLeft &&
            word.y0 > heading.y1 &&
            normalizeDigits(word.text) === normalizeDigits(label)
        ),
        `会期の小見出しが見つかりません: ${label}`
      );
      return { y: w.y0, label, slug };
    })
    .sort((a, b) => a.y - b.y);

  const bySlug = new Map<string, unknown[]>();
  results.forEach((result, r) => {
    const votes: Record<string, string | null> = {};
    grid[r].forEach((mark, c) => {
      if (!mark) throw new Error(`記号が読めないマスがあります: 行${r + 1} 列${c + 1}`);
      votes[members[c].name] = mark;
    });
    votes[members[members.length - 1].name] = null; // 議長

    let owner = headings[0];
    for (const h of headings) if (result.y0 >= h.y) owner = h;

    const list = bySlug.get(owner.slug) ?? [];
    list.push({
      session: owner.label,
      result: result.text,
      title: titles[r],
      votes,
    });
    bySlug.set(owner.slug, list);
  });

  const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
  fs.mkdirSync(outDir, { recursive: true });
  for (const [slug, rows] of bySlug) {
    const outPath = path.join(outDir, `${slug}-votes.json`);
    fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    console.log(`\n${rows.length}件を ${outPath} に書き出しました`);
    for (const row of rows as {
      result: string;
      title: string;
      votes: Record<string, string | null>;
    }[]) {
      const values = Object.values(row.votes);
      const yes = values.filter((m) => m === "賛成").length;
      const no = values.filter((m) => m === "反対").length;
      const absent = values.filter((m) => m === "欠席").length;
      const consistent = row.result === "否決" ? yes < no : yes > no;
      console.log(
        `  ${consistent ? " " : "❌"}[${row.result}] 賛成${yes} 反対${no} 欠席${absent}  ${row.title}`
      );
    }
  }
}

main();
