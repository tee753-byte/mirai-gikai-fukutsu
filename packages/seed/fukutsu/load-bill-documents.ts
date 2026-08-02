/**
 * 議案書から抽出した「理由」を読み込む。
 *
 * 【なぜ import ではなく実行時に読むのか】
 * このJSONは議案書PDFから機械的に取り出したもので、人事議案などに私人の
 * 個人情報が紛れ込む可能性がある。そのためリポジトリにはコミットしていない
 * （.gitignore の packages/seed/fukutsu/data/*-bill-documents.json）。
 *
 * 静的な import で読むと、ファイルが無い環境では型チェックもビルドも通らず、
 * リポジトリをクローンしただけの状態やCIが失敗してしまう。実行時に読み、
 * 無ければ空として扱う。
 *
 * ただし黙って空にすると、気づかないうちに議案書の理由がサイトから消える。
 * 見落とさないよう、読めなかったことを必ず警告として出す。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type BillDocument = {
  billNumber: string;
  reason: string | null;
};

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "data");

export function loadBillDocuments(fileName: string): BillDocument[] {
  const path = join(DATA_DIR, fileName);
  try {
    return JSON.parse(readFileSync(path, "utf8")) as BillDocument[];
  } catch {
    console.warn(
      `⚠️  ${fileName} が見つかりません。「議案書に記載された理由」は掲載されません。\n` +
        `   このファイルは議案書PDFから作るもので、個人情報を含みうるためリポジトリには入れていません。`
    );
    return [];
  }
}

/** 議案番号から理由を引ける形にする */
export function toReasonMap(
  documents: BillDocument[]
): Map<string, string | null> {
  return new Map(documents.map((doc) => [doc.billNumber, doc.reason]));
}
