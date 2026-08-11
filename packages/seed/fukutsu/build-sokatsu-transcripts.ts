/**
 * 会議録テキスト → 総括質疑のやり取り（raw_text）を生成するスクリプト
 *
 * build-transcripts.ts（一般質問向け）の総括質疑版。切り出し方は同じで、
 * 議長の終了宣言の文言だけが違う（splitSokatsuShitsugi を使う）。
 *
 * 使い方（会議録テキストを置いたフォルダを指定する）:
 *   cd packages/seed
 *   npx tsx fukutsu/build-sokatsu-transcripts.ts "C:/Users/Work/Desktop/AIwork/会議録" r8-3
 *
 * 会議録テキストそのものはリポジトリに入れず、生成物だけを
 * fukutsu/data/<slug>-sokatsu-transcripts.json に置く。
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildTranscript,
  normalizeName,
  parseMinutes,
  splitSokatsuShitsugi,
} from "./parse-minutes";

export type TranscriptEntry = {
  /** 全角スペースを除いた氏名。シードデータとの突き合わせに使う */
  questioner_name: string;
  questioner_number: string;
  /** 会議録ファイル名（出典の控え） */
  source_file: string;
  /** 議長を除いた、その議員の総括質疑のやり取り全文 */
  raw_text: string;
};

function main() {
  const [minutesDir, slug] = process.argv.slice(2);
  if (!minutesDir || !slug) {
    console.error(
      'Usage: npx tsx fukutsu/build-sokatsu-transcripts.ts "<会議録フォルダ>" <session-slug>'
    );
    process.exit(1);
  }

  const entries: TranscriptEntry[] = [];

  for (const file of readdirSync(minutesDir)
    .filter((f) => f.endsWith(".txt"))
    .sort()) {
    const blocks = parseMinutes(readFileSync(join(minutesDir, file), "utf8"));
    for (const section of splitSokatsuShitsugi(blocks)) {
      entries.push({
        questioner_name: normalizeName(section.questionerName),
        questioner_number: section.questionerNumber,
        source_file: file,
        raw_text: buildTranscript(section.speeches),
      });
    }
  }

  const outDir = join(dirname(fileURLToPath(import.meta.url)), "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${slug}-sokatsu-transcripts.json`);
  writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

  console.log(`✅ ${entries.length} transcripts → ${outPath}`);
  for (const e of entries) {
    console.log(
      `   ${e.questioner_number}番 ${e.questioner_name}  ${e.raw_text.length}字  (${e.source_file})`
    );
  }
}

main();
