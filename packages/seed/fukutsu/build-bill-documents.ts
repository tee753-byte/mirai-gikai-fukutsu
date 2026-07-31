/**
 * 議案書PDFから、議案ごとの件名と理由をまとめたJSONを作る。
 *
 * 使い方:
 *   npx tsx fukutsu/build-bill-documents.ts "C:/…/令和8年3月定例会_議案" r8-3
 *
 * 事前に poppler の pdftotext が使えることを確認しておく（Git Bash に同梱）。
 *   pdftotext -v
 *
 * 議案書PDFそのものは再配布の可否が未確認のためリポジトリに入れない。
 * ここで作った生成物（理由文のJSON）だけをコミットする。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type BillDocumentEntry,
  parseBillDocument,
} from "./parse-bill-document";

/** PDFをテキストにする。pdftotext は書式エラーを標準エラーに出すが、本文は取れるので無視する */
function pdfToText(pdfPath: string): string {
  return execFileSync("pdftotext", ["-enc", "UTF-8", pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function listPdfs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listPdfs(full);
      return entry.name.toLowerCase().endsWith(".pdf") ? [full] : [];
    })
    .sort();
}

function main() {
  const [dir, slug] = process.argv.slice(2);
  if (!dir || !slug) {
    console.error(
      'usage: npx tsx fukutsu/build-bill-documents.ts "<議案書フォルダ>" <session_slug>'
    );
    process.exit(1);
  }

  const pdfs = listPdfs(dir);
  console.log(`${pdfs.length}件のPDFを読みます`);

  // 同じ議案が複数のPDFに載ることがある（一括の議案書と個別の議案書）。
  // 理由が取れているほうを残す。
  const merged = new Map<string, BillDocumentEntry>();
  for (const pdf of pdfs) {
    let entries: BillDocumentEntry[];
    try {
      entries = parseBillDocument(pdfToText(pdf));
    } catch (error) {
      console.log(`  ⚠️ 読めませんでした: ${path.basename(pdf)} (${error})`);
      continue;
    }
    for (const entry of entries) {
      const prev = merged.get(entry.billNumber);
      if (!prev || (!prev.reason && entry.reason)) merged.set(entry.billNumber, entry);
    }
  }

  const records = [...merged.values()].sort((a, b) =>
    a.billNumber.localeCompare(b.billNumber, "ja", { numeric: true })
  );

  const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}-bill-documents.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  const withReason = records.filter((r) => r.reason);
  console.log(`${records.length}件を ${outPath} に書き出しました`);
  console.log(`  理由が取れたもの: ${withReason.length}件`);
  const without = records.filter((r) => !r.reason).map((r) => r.billNumber);
  if (without.length > 0) {
    console.log(`  理由欄が無いもの: ${without.join(", ")}`);
  }
}

main();
