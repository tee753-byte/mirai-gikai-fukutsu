/**
 * 市議会だよりPDF（賛否一覧表のページ）→ 議員別の賛否JSON を作る。
 *
 * 使い方:
 *   cd packages/seed
 *   npx tsx fukutsu/build-member-votes.ts "<賛否表ページのPDF>" r7-6 "6月定例会"
 *
 * 事前に poppler の pdftotext が要る（PDFから文字と座標を取り出すため）。
 * PDFそのものはリポジトリに入れず、出来上がった data/<slug>-votes.json だけを置く。
 *
 * 【使えるPDFの条件】文字データ（テキスト層）が入っている号だけ。
 * スキャン画像の号（84号・85号）は1文字も取れないので、このスクリプトは使えない。
 * 判定は簡単で、記号が1つも見つからなければその旨を出して終わる。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGikaidayoriVotes } from "./parse-gikaidayori-votes";

function main() {
  const [pdfPath, slug, sessionLabel] = process.argv.slice(2);
  if (!pdfPath || !slug || !sessionLabel) {
    console.error(
      'usage: npx tsx fukutsu/build-member-votes.ts "<賛否表ページのPDF>" <session_slug> "<会期の呼び名>"'
    );
    process.exit(1);
  }

  const xmlPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "gikaidayori-")),
    "bbox.xml"
  );
  execFileSync("pdftotext", ["-bbox-layout", pdfPath, xmlPath]);
  const rows = parseGikaidayoriVotes(
    fs.readFileSync(xmlPath, "utf8"),
    sessionLabel
  );

  if (rows.length === 0) {
    console.error(
      "❌ 賛否表が見つかりませんでした。\n" +
        "   このPDFはスキャン画像で、文字データが入っていない可能性があります。"
    );
    process.exit(1);
  }

  const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}-votes.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");

  console.log(`${rows.length}件を ${outPath} に書き出しました`);
  for (const row of rows) {
    const counts = { 賛成: 0, 反対: 0, 欠席: 0, 棄権: 0, 不参加: 0 };
    for (const mark of Object.values(row.votes)) {
      if (mark === null) counts.不参加 += 1;
      else counts[mark] += 1;
    }
    console.log(
      `  [${row.result}] ${row.title}\n` +
        `      賛成${counts.賛成} 反対${counts.反対} 欠席${counts.欠席} 棄権${counts.棄権} 議長${counts.不参加}`
    );
  }
}

main();
