/**
 * 会議録テキスト → 一般質問のやり取り（raw_text）を生成するスクリプト
 *
 * 使い方（会議録テキストを置いたフォルダを指定する）:
 *   cd packages/seed
 *   npx tsx fukutsu/build-transcripts.ts "C:/Users/Work/Desktop/AIwork/会議録" r8-3
 *
 * 会議録テキストそのものはリポジトリに入れず、生成物だけを
 * fukutsu/data/<slug>-transcripts.json に置く。
 *
 * 対象ファイルは、一般質問が行われた日の会議録に限る。
 * ファイル名に「_5日目」のように日付が入っている前提で、引数の後ろに
 * 日目の番号を並べて指定できる（省略時は一般質問が見つかった日すべて）。
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildTranscript,
  normalizeName,
  parseMinutes,
  splitGeneralQuestions,
} from "./parse-minutes";

export type TranscriptEntry = {
  /** 全角スペースを除いた氏名。シードデータとの突き合わせに使う */
  questioner_name: string;
  questioner_number: string;
  /** 会議録ファイル名（出典の控え） */
  source_file: string;
  /** 議長を除いた、その議員の一般質問のやり取り全文 */
  raw_text: string;
};

function main() {
  const [minutesDir, slug] = process.argv.slice(2);
  if (!minutesDir || !slug) {
    console.error(
      'Usage: npx tsx fukutsu/build-transcripts.ts "<会議録フォルダ>" <session-slug>'
    );
    process.exit(1);
  }

  const entries: TranscriptEntry[] = [];

  for (const file of readdirSync(minutesDir).filter((f) => f.endsWith(".txt")).sort()) {
    const blocks = parseMinutes(readFileSync(join(minutesDir, file), "utf8"));
    for (const section of splitGeneralQuestions(blocks)) {
      // 一般質問ではない日（議案質疑・討論のみ）は切り出されないので素通りする
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
  const outPath = join(outDir, `${slug}-transcripts.json`);
  writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

  console.log(`✅ ${entries.length} transcripts → ${outPath}`);
  for (const e of entries) {
    console.log(
      `   ${e.questioner_number}番 ${e.questioner_name}  ${e.raw_text.length}字  (${e.source_file})`
    );
  }
}

main();
