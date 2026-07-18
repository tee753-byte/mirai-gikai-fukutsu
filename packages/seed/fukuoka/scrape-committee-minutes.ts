/**
 * scrape-committee-minutes.ts
 *
 * 福岡県議会 会議録検索システム（dbsr.jp）から現行委員会の議事録を取得し、
 * docs/data/committee-minutes/<年>/ にJSONで保存する。
 *
 * 実行例:
 *   cd packages/seed
 *   npx tsx fukuoka/scrape-committee-minutes.ts            # 2026年分を取得
 *   npx tsx fukuoka/scrape-committee-minutes.ts --year 2026
 *
 * 特徴:
 * - セッションはトップページ取得時に発行されるcookie＋URLパスのIDで維持する
 * - リクエスト間に1秒のウェイトを入れる（サーバー負荷への配慮）
 * - 取得済みのDocumentIDはスキップするため再実行しても差分のみ取得する
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRawText,
  buildSourceUrl,
  CURRENT_COMMITTEES,
  committeeFromTitle,
  extractHitCount,
  extractSessionId,
  type ListedDoc,
  parseDocPage,
  parseListPage,
  type Speech,
} from "./parse-committee-minutes";

const BASE_URL = "https://www.pref.fukuoka.dbsr.jp";
const WAIT_MS = 2000;
/** 429/503・タイムアウト時のリトライ回数と待ち時間（秒） */
const RETRY_DELAYS_SEC = [30, 60, 120];
const REQUEST_TIMEOUT_MS = 30_000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");

/** 保存するJSONのシェイプ */
type MeetingJson = {
  documentId: number;
  title: string;
  committee: {
    dbsrName: string;
    currentName: string;
    slug: string;
    type: string;
    cabinetId: number;
  };
  meetingDate: string;
  sourceUrl: string;
  scrapedAt: string;
  speechCount: number;
  speeches: Speech[];
  rawText: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** cookieを維持しつつ1秒間隔でHTMLを取得する簡易クライアント */
class DbsrClient {
  private cookie = "";
  private sessionId = "";

  private async request(url: string, body?: URLSearchParams): Promise<string> {
    for (let attempt = 0; ; attempt++) {
      await sleep(WAIT_MS);
      let res: Response;
      try {
        res = await fetch(url, {
          method: body ? "POST" : "GET",
          headers: {
            ...(this.cookie ? { Cookie: this.cookie } : {}),
            ...(body
              ? { "Content-Type": "application/x-www-form-urlencoded" }
              : {}),
            "User-Agent":
              "mirai-gikai-fukuoka-pref scraper (contact: GitHub bakumon1107)",
          },
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (e) {
        // タイムアウト・一時的な接続断はリトライする
        if (attempt < RETRY_DELAYS_SEC.length) {
          const waitSec = RETRY_DELAYS_SEC[attempt];
          console.warn(
            `リクエスト失敗（${e instanceof Error ? e.name : e}）。${waitSec}秒待って再試行します（${attempt + 1}/${RETRY_DELAYS_SEC.length}）`
          );
          await sleep(waitSec * 1000);
          continue;
        }
        throw e;
      }

      // 一時的なレート制限はRetry-After（なければ既定値）だけ待って再試行する
      if (
        (res.status === 429 || res.status === 503) &&
        attempt < RETRY_DELAYS_SEC.length
      ) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const waitSec =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter
            : RETRY_DELAYS_SEC[attempt];
        console.warn(
          `HTTP ${res.status} を受信。${waitSec}秒待って再試行します（${attempt + 1}/${RETRY_DELAYS_SEC.length}）`
        );
        await sleep(waitSec * 1000);
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) {
        this.cookie = setCookie.split(";")[0];
      }
      return res.text();
    }
  }

  /** トップページにアクセスしてセッションを開始する */
  async init(): Promise<void> {
    const html = await this.request(`${BASE_URL}/index.php/`);
    const sid = extractSessionId(html);
    if (!sid) {
      throw new Error("セッションIDを取得できませんでした");
    }
    this.sessionId = sid;
  }

  private sessionUrl(query = ""): string {
    return `${BASE_URL}/index.php/${this.sessionId}${query}`;
  }

  /**
   * 現行委員会×本文×指定年以降で検索条件を設定する。
   * 会議名・分類・期間は1回のPOSTでまとめて指定できる（実機で確認済み）。
   */
  async applySearchFilter(year: number): Promise<string> {
    const params = new URLSearchParams();
    for (const c of CURRENT_COMMITTEES) {
      params.append("Cabinet[]", String(c.cabinetId));
    }
    params.append("Class[]", "3"); // 本文のみ（名簿・資料・目次を除く）
    params.set("TermStartYear", String(year));
    params.set("TermStartMonth", "1");
    params.set("TermStartDay", "1");
    params.set("Template", "List");
    params.set("ListType", "Doc");
    params.set("QueryType", "Refine");
    return this.request(this.sessionUrl(), params);
  }

  async fetchListPage(page: number): Promise<string> {
    return this.request(this.sessionUrl(`?Template=list&Page=${page}`));
  }

  /** 文書をセッションにセットし、全発言のHTMLを取得する */
  async fetchDocument(documentId: number): Promise<string> {
    const frameHtml = await this.request(
      this.sessionUrl(
        `?Template=doc-all-frame&VoiceType=all&DocumentID=${documentId}`
      )
    );
    // フレームセットが指すセッションIDに追従する（通常は同一）
    const sid = extractSessionId(frameHtml);
    if (sid) {
      this.sessionId = sid;
    }
    return this.request(this.sessionUrl("?Template=doc-page"));
  }
}

/** 取得済みDocumentIDの一覧（ファイル名末尾の _<id>.json から復元） */
function loadScrapedIds(outDir: string): Set<number> {
  if (!existsSync(outDir)) return new Set();
  const ids = new Set<number>();
  for (const name of readdirSync(outDir)) {
    const m = name.match(/_(\d+)\.json$/);
    if (m) ids.add(Number(m[1]));
  }
  return ids;
}

async function main(): Promise<void> {
  const yearArgIndex = process.argv.indexOf("--year");
  const year =
    yearArgIndex >= 0 ? Number(process.argv[yearArgIndex + 1]) : 2026;
  if (!Number.isInteger(year) || year < 1995) {
    throw new Error(`不正な年指定です: ${process.argv[yearArgIndex + 1]}`);
  }

  const outDir = join(REPO_ROOT, "docs/data/committee-minutes", String(year));
  mkdirSync(outDir, { recursive: true });
  const scrapedIds = loadScrapedIds(outDir);

  const client = new DbsrClient();
  await client.init();
  console.log("セッション開始");

  // 検索条件を設定し、一覧を全ページ収集する
  const firstPage = await client.applySearchFilter(year);
  console.log(`検索ヒット: ${extractHitCount(firstPage) ?? "不明"}文書`);

  // 一覧は新しい順のため、対象年より古い開催日が現れたらページ送りを打ち切る
  // （検索条件が適用されなかった場合でも全ページを舐めないための安全装置）
  const cutoff = `${year}-01-01`;
  const allDocs: ListedDoc[] = [];
  let { docs, hasNext } = parseListPage(firstPage);
  allDocs.push(...docs);
  for (
    let page = 2;
    hasNext && !docs.some((d) => d.date < cutoff);
    page++
  ) {
    const html = await client.fetchListPage(page);
    ({ docs, hasNext } = parseListPage(html));
    allDocs.push(...docs);
    console.log(`一覧ページ${page}を取得（累計${allDocs.length}文書）`);
  }
  // ページ送りで同じ文書が重複して返ることがあるためDocumentIDで一意化する
  const uniqueDocs = [
    ...new Map(allDocs.map((d) => [d.documentId, d])).values(),
  ];
  console.log(`検索結果: ${uniqueDocs.length}文書（重複除去前${allDocs.length}）`);

  let saved = 0;
  let skipped = 0;
  for (const doc of uniqueDocs) {
    const committee = committeeFromTitle(doc.title);
    if (!committee) {
      console.warn(`対象外のタイトルをスキップ: ${doc.title}`);
      continue;
    }
    if (!doc.date.startsWith(`${year}-`)) {
      console.warn(`${year}年以外の開催日をスキップ: ${doc.title} (${doc.date})`);
      continue;
    }
    if (scrapedIds.has(doc.documentId)) {
      skipped++;
      continue;
    }

    const pageHtml = await client.fetchDocument(doc.documentId);
    const speeches = parseDocPage(pageHtml);
    if (speeches.length === 0) {
      console.warn(`発言が取得できませんでした: ${doc.title} (DocumentID=${doc.documentId})`);
      continue;
    }

    const json: MeetingJson = {
      documentId: doc.documentId,
      title: doc.title,
      committee: {
        dbsrName: committee.dbsrName,
        currentName: committee.currentName,
        slug: committee.slug,
        type: committee.type,
        cabinetId: committee.cabinetId,
      },
      meetingDate: doc.date,
      sourceUrl: buildSourceUrl(doc.documentId),
      scrapedAt: new Date().toISOString(),
      speechCount: speeches.length,
      speeches,
      rawText: buildRawText(speeches),
    };

    const fileName = `${doc.date}_${committee.slug}_${doc.documentId}.json`;
    writeFileSync(join(outDir, fileName), `${JSON.stringify(json, null, 2)}\n`);
    saved++;
    console.log(`保存: ${fileName}（${speeches.length}発言）`);
  }

  console.log(
    `完了: 新規${saved}件 / スキップ（取得済み）${skipped}件 / 合計${allDocs.length}文書`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
