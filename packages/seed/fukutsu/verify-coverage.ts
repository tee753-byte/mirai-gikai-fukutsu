/**
 * 会議録に記録されているものが、サイトに載るデータに全部入っているかを確かめる。
 *
 * 使い方（会期ごとに会議録テキストを置いたフォルダを指定する）:
 *   cd packages/seed
 *   npx tsx fukutsu/verify-coverage.ts "C:/Users/Work/Desktop/AIwork/会議録/r8-3" r8-3
 *
 * 取りこぼしがあれば終了コード1で終わる。データを作り直したら必ず通すこと。
 *
 * 【会議録フォルダについて】
 * 指定したフォルダの .txt を全部読む。会期ごとにフォルダを分けておくこと。
 * 会議録テキストそのものはリポジトリに入れない（著作権の扱いが未確認）。
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findCoverageGaps } from "./check-coverage";
import { generalQuestionsBySession } from "./general-questions-data";
import { FUKUTSU_SESSIONS } from "./sessions";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "data");

type BillVoteLike = { billNumber: string };

/** 会期の議案データ。まだ作っていない会期は空として扱う */
function loadBillNumbers(slug: string): string[] {
  const path = join(DATA_DIR, `${slug}-bill-votes.json`);
  try {
    const votes = JSON.parse(readFileSync(path, "utf8")) as BillVoteLike[];
    return votes.map((v) => v.billNumber);
  } catch {
    console.warn(`⚠️  ${slug}-bill-votes.json が読めません。議案は空として確認します。`);
    return [];
  }
}

/**
 * 請願は会議録の議決文の書式が議案と違って独立して拾えないため、
 * 直前の議案に紐づいた塊から切り出して別管理している（petitions-*.ts）。
 * 取りこぼしの確認では、そちらに入っているものも「載っている」として数える。
 *
 * 会期ごとに書くと請願を足したときに直し忘れるので、実際にサイトに載る
 * 定義（FUKUTSU_SESSIONS の plainTexts）から引く。
 */
function loadPetitionNumbers(slug: string): string[] {
  const session = FUKUTSU_SESSIONS.find((s) => s.slug === slug);
  return Object.keys(session?.plainTexts ?? {}).filter((n) =>
    n.startsWith("請願第")
  );
}

function loadQuestioners(slug: string): string[] {
  const session = generalQuestionsBySession.find(
    (s) => s.session_slug === slug
  );
  return session ? session.questions.map((q) => q.questioner_name) : [];
}

function main() {
  const [dir, slug] = process.argv.slice(2);
  if (!dir || !slug) {
    console.error(
      'usage: npx tsx fukutsu/verify-coverage.ts "<会期の会議録フォルダ>" <session_slug>'
    );
    process.exit(1);
  }

  const files = readdirSync(dir).filter(
    (f) => f.endsWith(".txt") && !f.includes("日程一覧")
  );
  if (files.length === 0) {
    console.error(`会議録テキストが見つかりません: ${dir}`);
    process.exit(1);
  }

  const result = findCoverageGaps({
    minutes: files.map((f) => readFileSync(join(dir, f), "utf8")),
    seededBillNumbers: [
      ...loadBillNumbers(slug),
      ...loadPetitionNumbers(slug),
    ],
    seededQuestioners: loadQuestioners(slug),
  });

  // 何件と突き合わせたかを必ず出す。0件なら検査が空振りしている
  console.log(
    `${slug}: 会議録${files.length}日分 ` +
      `／ 議決${result.decidedCount}件 ` +
      `／ 一般質問${result.questionerCount}人 と突き合わせました`
  );

  if (result.gaps.length === 0) {
    console.log("✅ 会議録にあるものはすべてデータに入っています");
    return;
  }

  for (const gap of result.gaps) {
    console.error(
      `❌ ${gap.kind}に取りこぼしがあります（会議録にあるのにデータに無い）:\n` +
        `   ${gap.missing.join(", ")}`
    );
  }
  console.error(
    "\n会議録の書き方が変わって抽出から外れた可能性があります。" +
      "\nparse-bill-votes.ts / parse-minutes.ts を確認してください。"
  );
  process.exit(1);
}

main();
