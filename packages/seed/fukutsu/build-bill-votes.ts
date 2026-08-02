/**
 * 会議録テキストから、議案の議決結果・討論・提案理由説明をまとめたJSONを作る。
 *
 * 使い方:
 *   npx tsx fukutsu/build-bill-votes.ts "C:/Users/Work/Desktop/AIwork/会議録" r8-3
 *
 * 会議録テキスト本体はリポジトリに入れない（著作権の扱いが未確認）。
 * ここで作った生成物だけをコミットする。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type BillVote,
  extractProposalReasons,
  extractSponsors,
  parseBillVotes,
  type Sponsor,
} from "./parse-bill-votes";

type BillVoteRecord = BillVote & {
  /** 初日の提案理由説明（会議録からの引用） */
  proposalReason: string | null;
  /** 付託された委員会の委員長報告（主な質疑と答弁） */
  committeeReport: string | null;
  /** 発議の提出者・賛成者（会議録に氏名が読み上げられている） */
  sponsors: Sponsor[];
  sourceFile: string;
};

/** 委員長報告かどうかの見分け。委員長報告には必ず質疑と答弁の要約が入る */
function isCommitteeReport(body: string): boolean {
  return /主な質疑及び答弁|審査結果|審査経過/.test(body);
}

/**
 * 提出者の提案理由の説明を、討論から取り除く。
 *
 * 発議は提出議員が提案理由を説明したあと、質疑・討論に進む。会議録上、
 * この説明が討論の区間に含まれてしまい、賛成討論として数えられていた
 * （令和7年12月定例会 発議第8号）。提案説明は賛否を述べる発言ではないので、
 * 討論の人数にも入れない。
 *
 * 提案理由説明と討論は同じ発言の書き起こしなので、提案理由の書き出しを
 * そのまま含んでいるかで見分ける。反対討論が提案理由に触れることはあるが、
 * 40字が一言一句そのままということはない。
 */
function withoutProposalSpeech<T extends { rawText: string }>(
  debates: T[],
  proposalReason: string | null
): T[] {
  if (!proposalReason) return debates;

  const strip = (text: string) => text.replace(/[\s　]/g, "");
  const key = strip(proposalReason).slice(0, 40);
  if (key.length < 40) return debates;

  return debates.filter((d) => !strip(d.rawText).includes(key));
}

/**
 * 会期をまたぐ会議録が混ざっていないかを確かめる。
 *
 * このスクリプトは渡されたフォルダの .txt を全部読み、引数の会期名は
 * 出力ファイル名にしか使わない。会期ごとにフォルダを分けておく前提だが、
 * 会議録を1か所にまとめたフォルダを渡すと、全会期ぶんが1つの会期の
 * データとして書き出され、他の会期のファイルまで同じ内容で上書きされる。
 *
 * 会議録のファイル名は先頭が YYYYMMDD。1つの会期が2か月を超えることはない。
 */
function assertSingleSession(files: string[]): void {
  const dates = files
    .map((f) => f.match(/^(\d{8})/)?.[1])
    .filter((d): d is string => Boolean(d))
    .sort();
  if (dates.length < 2) return;

  const toDate = (d: string) =>
    new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`);
  const spanDays =
    (toDate(dates[dates.length - 1]).getTime() - toDate(dates[0]).getTime()) /
    86_400_000;

  if (spanDays > 60) {
    console.error(
      `❌ 会議録が ${dates[0]} 〜 ${dates[dates.length - 1]} と${Math.round(spanDays)}日に及んでいます。\n` +
        "   複数の会期が混ざっていませんか。会期ごとにフォルダを分けて渡してください。\n" +
        "   （このまま実行すると、他の会期のデータまで同じ内容で上書きされます）"
    );
    process.exit(1);
  }
}

function main() {
  const [dir, slug] = process.argv.slice(2);
  if (!dir || !slug) {
    console.error(
      'usage: npx tsx fukutsu/build-bill-votes.ts "<会期の会議録フォルダ>" <session_slug>'
    );
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".txt") && !f.includes("日程一覧"))
    .sort();

  assertSingleSession(files);

  // 提案理由説明と委員長報告は会議録上おなじ書式で読み上げられるため、
  // 日付順に見て「先に出たほう＝提案理由説明」「質疑応答が入るほう＝委員長報告」で振り分ける。
  const reasons = new Map<string, string>();
  const committeeReports = new Map<string, string>();
  for (const file of files) {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    for (const [billNumber, body] of extractProposalReasons(text)) {
      if (isCommitteeReport(body)) {
        const prev = committeeReports.get(billNumber);
        if (!prev || body.length > prev.length) {
          committeeReports.set(billNumber, body);
        }
        continue;
      }
      // 提案理由説明は最初に出たものを採る（後日の再掲より初日の説明が正確）
      if (!reasons.has(billNumber)) reasons.set(billNumber, body);
    }
  }

  const records: BillVoteRecord[] = [];
  files.forEach((file, i) => {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    for (const vote of parseBillVotes(text, i + 1)) {
      const reason = reasons.get(vote.billNumber) ?? null;
      records.push({
        ...vote,
        // 提出者の提案理由の説明は討論ではない
        debates: withoutProposalSpeech(vote.debates, reason),
        proposalReason: reason,
        committeeReport: committeeReports.get(vote.billNumber) ?? null,
        sponsors: reason ? extractSponsors(reason) : [],
        sourceFile: file,
      });
    }
  });

  const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}-bill-votes.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  const withoutReason = records.filter((r) => !r.proposalReason);
  console.log(`${records.length}件を ${outPath} に書き出しました`);
  console.log(`  討論あり: ${records.filter((r) => r.debates.length).length}件`);
  console.log(`  否決: ${records.filter((r) => r.outcome === "rejected").length}件`);
  if (withoutReason.length > 0) {
    console.log(
      `  提案理由説明が取れなかった議案: ${withoutReason.map((r) => r.billNumber).join(", ")}`
    );
  }
}

main();
