/**
 * 会議録から作った議案データ（bills-r8-3.tsと同じ形）を投入する共通処理。
 *
 * r8-3は先に個別実装済み（seed-bills-r8-3.ts）のためそのまま残し、
 * それ以降に追加する会期（r7-12・r8-1・r8-2など）はこちらを共有する。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { findMemberParty } from "./members";
import {
  type BillVote,
  describeVoteMethod,
  type Sponsor,
  type VoteMethod,
} from "./parse-bill-votes";

// biome-ignore lint/suspicious/noExplicitAny: seedスクリプト内でのみ使う簡易クライアント型
type Client = SupabaseClient<any, "public", any>;

/** build-bill-votes.ts が書き出す議案データの形（提案理由・委員会報告・発議の提出者を含む） */
export type BillVoteRecord = BillVote & {
  proposalReason: string | null;
  committeeReport: string | null;
  sponsors: Sponsor[];
  sourceFile: string;
};

export type PlainText = {
  /** 市民向けの見出し */
  title: string;
  /** 市民向けの要約。会議録の提案理由説明をもとに平易に書き直したもの */
  summary: string;
  /** どの分野の議案か（タグ付けに使う） */
  tag: string;
  /** 付託された委員会。議員提出の発議など委員会付託が無いものはnull */
  committee: string | null;
};

export type SeedBillsForSessionInput = {
  supabase: Client;
  sessionId: string;
  tagIdByLabel: Map<string, string>;
  committeeIdByName: Map<string, string>;
  /** ログ出力・エラーメッセージに使う会期の呼び名。例: "r7-12" */
  slugLabel: string;
  votes: BillVoteRecord[];
  plainTexts: Record<string, PlainText>;
  sourceUrl: string;
  /** 会議録の何日目に議決されたかから、議決日（YYYY-MM-DD）を返す */
  decidedAt: (sessionDay: number) => string;
  /** 議案番号から、上程日（YYYY-MM-DD）を返す */
  submittedAt: (billNumber: string) => string;
};

/** 請願かどうか。請願は議案と議決の言い方が違う（可決／否決ではなく採択／不採択） */
function isPetition(billNumber: string): boolean {
  return billNumber.startsWith("請願");
}

/** 議案番号の頭文字から bills.bill_type を決める */
function toBillType(billNumber: string): string {
  if (isPetition(billNumber)) return "petition";
  if (billNumber.startsWith("発議")) return "member_bill";
  return "bill";
}

/** 会議録の結果を bills.status に置き換える */
function toBillStatus(
  outcome: string,
  billNumber: string
): "approved" | "rejected" | "adopted" {
  if (outcome === "rejected") return "rejected";
  return isPetition(billNumber) ? "adopted" : "approved";
}

/** 議決結果を市民向けの一文にする */
function buildStatusNote(
  outcome: string,
  voteMethod: VoteMethod,
  decided: string,
  billNumber: string
): string {
  const rejected = outcome === "rejected";
  const result = isPetition(billNumber)
    ? rejected
      ? "不採択"
      : "採択"
    : rejected
      ? "否決"
      : "可決";
  const [y, m, d] = decided.split("-").map(Number);
  const wareki = y - 2018; // 2019年が令和元年
  return `令和${wareki}年${m}月${d}日の本会議で${result}／${describeVoteMethod(voteMethod)}`;
}

/** 引用として表示するための記法。改行のある文章でも引用ブロックが途切れないようにする */
function asQuote(text: string): string {
  return `> ${text.replace(/\n/g, "\n> ")}`;
}

/** くわしい説明。どの資料からの引用かを必ず明示する */
function buildHardContent(
  billName: string,
  statusNote: string,
  proposalReason: string | null,
  committeeReport: string | null,
  billNumber: string
): string {
  const petition = isPetition(billNumber);
  const parts = [`## 議決結果\n\n${statusNote}`];

  if (proposalReason) {
    parts.push(
      `## 市が議会で説明した提案理由\n\n以下は会議録からの引用です。\n\n${asQuote(proposalReason)}`
    );
  }
  if (committeeReport) {
    parts.push(
      `## 委員会での審査\n\n以下は委員長報告の会議録からの引用です。\n\n${asQuote(committeeReport)}`
    );
  }
  // 請願は市民が提出するものなので「市の説明」ではない。請願書そのものも
  // 非公開資料のため、載せているのが会議録の記録だけであることを明示する
  parts.push(
    petition
      ? `## 正式な件名\n\n${billName}\n\nここに載せているのは、会議録に記録された委員会での審査内容と議決結果です。請願書そのもの（請願の趣旨・請願人）は、この非公式サイトでは掲載していません。`
      : `## 正式な件名\n\n${billName}\n\nここに載せているのは、会議録に記録された市の説明です。議案書そのものは、この非公式サイトでは再掲載していません。`
  );

  return parts.join("\n\n");
}

/** やさしい説明 */
function buildNormalContent(
  summary: string,
  statusNote: string,
  billNumber: string
): string {
  const subject = isPetition(billNumber) ? "請願" : "議案";
  const note = isPetition(billNumber)
    ? "この説明は、会議録に記録された委員会での審査内容をもとに、AIがわかりやすく書き直したものです。"
    : "この説明は、会議録に記録された市の説明をもとに、AIがわかりやすく書き直したものです。";
  return `${summary}\n\n## この${subject}はどうなったか\n\n${statusNote}\n\n${note}`;
}

/**
 * 議案（bills）・やさしい／くわしい説明（bill_contents）・タグ（bills_tags）・
 * 討論（bill_debates）・発議の提出者/賛成者（bill_sponsors）を投入する。
 */
export async function seedBillsForSession({
  supabase,
  sessionId,
  tagIdByLabel,
  committeeIdByName,
  slugLabel,
  votes,
  plainTexts,
  sourceUrl,
  decidedAt,
  submittedAt,
}: SeedBillsForSessionInput): Promise<{ id: string; bill_number: string }[]> {
  // ── bills ──
  const billRows = votes.map((v) => {
    const plain = plainTexts[v.billNumber];
    const decided = decidedAt(v.sessionDay);
    return {
      name: v.billName,
      bill_number: v.billNumber,
      bill_type: toBillType(v.billNumber),
      status: toBillStatus(v.outcome, v.billNumber),
      status_note: buildStatusNote(
        v.outcome,
        v.voteMethod as VoteMethod,
        decided,
        v.billNumber
      ),
      vote_method: v.voteMethod,
      published_at: `${submittedAt(v.billNumber)}T00:00:00+09:00`,
      publish_status: "published",
      // 注目の議案は「議会の判断が分かれたもの」で機械的に決める。
      // 特定の議員や立場を目立たせないため、人が選ぶ運用にはしない。
      is_featured: v.outcome === "rejected",
      source_url: sourceUrl,
      council_session_id: sessionId,
      committee_id: plain.committee
        ? (committeeIdByName.get(plain.committee) ?? null)
        : null,
    };
  });

  const { data: insertedBills, error } = await supabase
    .from("bills")
    .insert(billRows)
    .select("id, bill_number");

  if (error) {
    throw new Error(`Failed to insert ${slugLabel} bills: ${error.message}`);
  }
  if (!insertedBills) {
    throw new Error(`No ${slugLabel} bills were inserted`);
  }

  const billIdByNumber = new Map<string, string>(
    insertedBills.map((b: { id: string; bill_number: string }) => [
      b.bill_number,
      b.id,
    ])
  );
  console.log(`✅ Inserted ${insertedBills.length} ${slugLabel} bills`);

  // ── bill_contents（やさしい／くわしい） ──
  const contentRows = votes.flatMap((v) => {
    const billId = billIdByNumber.get(v.billNumber);
    if (!billId) return [];
    const plain = plainTexts[v.billNumber];
    const statusNote = buildStatusNote(
      v.outcome,
      v.voteMethod as VoteMethod,
      decidedAt(v.sessionDay),
      v.billNumber
    );

    return [
      {
        bill_id: billId,
        difficulty_level: "normal" as const,
        title: plain.title,
        summary: plain.summary,
        content: buildNormalContent(plain.summary, statusNote, v.billNumber),
      },
      {
        bill_id: billId,
        difficulty_level: "hard" as const,
        title: v.billName,
        summary: plain.summary,
        content: buildHardContent(
          v.billName,
          statusNote,
          v.proposalReason ?? null,
          v.committeeReport ?? null,
          v.billNumber
        ),
      },
    ];
  });

  const { error: contentError } = await supabase
    .from("bill_contents")
    .insert(contentRows);
  if (contentError) {
    throw new Error(
      `Failed to insert ${slugLabel} bill contents: ${contentError.message}`
    );
  }
  console.log(`✅ Inserted ${contentRows.length} ${slugLabel} bill contents`);

  // ── bills_tags ──
  const tagRows = votes.flatMap((v) => {
    const billId = billIdByNumber.get(v.billNumber);
    const tagId = tagIdByLabel.get(plainTexts[v.billNumber].tag);
    return billId && tagId ? [{ bill_id: billId, tag_id: tagId }] : [];
  });

  const { error: tagError } = await supabase.from("bills_tags").insert(tagRows);
  if (tagError) {
    throw new Error(
      `Failed to insert ${slugLabel} bills-tags: ${tagError.message}`
    );
  }
  console.log(`✅ Inserted ${tagRows.length} ${slugLabel} bills-tags relations`);

  // ── bill_debates（賛成討論・反対討論。氏名は会議録に残っている確実な情報） ──
  const debateRows = votes.flatMap((v) => {
    const billId = billIdByNumber.get(v.billNumber);
    if (!billId) return [];
    return v.debates.map((d, i) => ({
      bill_id: billId,
      stance: d.stance,
      speaker_name: d.speakerName,
      speaker_number: d.speakerNumber,
      speaker_party: findMemberParty(d.speakerName),
      raw_text: d.rawText,
      speech_order: i + 1,
    }));
  });

  if (debateRows.length > 0) {
    const { error: debateError } = await supabase
      .from("bill_debates")
      .insert(debateRows);
    if (debateError) {
      throw new Error(`Failed to insert bill debates: ${debateError.message}`);
    }
  }
  console.log(`✅ Inserted ${debateRows.length} ${slugLabel} bill debates`);

  // ── bill_sponsors（発議の提出者・賛成者） ──
  const sponsorRows = votes.flatMap((v) => {
    const billId = billIdByNumber.get(v.billNumber);
    if (!billId) return [];
    return v.sponsors.map((s, i) => ({
      bill_id: billId,
      role: s.role,
      member_name: s.memberName,
      member_party: findMemberParty(s.memberName),
      sort_order: i + 1,
    }));
  });

  if (sponsorRows.length > 0) {
    const { error: sponsorError } = await supabase
      .from("bill_sponsors")
      .insert(sponsorRows);
    if (sponsorError) {
      throw new Error(`Failed to insert bill sponsors: ${sponsorError.message}`);
    }
  }
  console.log(`✅ Inserted ${sponsorRows.length} ${slugLabel} bill sponsors`);

  return insertedBills;
}
