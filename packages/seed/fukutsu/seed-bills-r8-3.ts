/**
 * 令和8年3月定例会の議案を投入する。
 *
 * 会議録から取れる事実（議決結果・採決のとり方・討論・提出者/賛成者）と、
 * それをもとにAIが書いた平易な要約を、議案ごとに同じ項目で入れる。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  decidedAt,
  documentReason,
  getPublishableBillVotes,
  PLAIN_TEXTS,
  R8_3_SOURCE_URL,
  submittedAt,
} from "./bills-r8-3";
import { findMemberParty } from "./members";
import { describeVoteMethod, type VoteMethod } from "./parse-bill-votes";

// biome-ignore lint/suspicious/noExplicitAny: seedスクリプト内でのみ使う簡易クライアント型
type Client = SupabaseClient<any, "public", any>;

/** 会議録の結果を bills.status に置き換える */
function toBillStatus(outcome: string): "approved" | "rejected" {
  return outcome === "rejected" ? "rejected" : "approved";
}

/** 議決結果を市民向けの一文にする */
function buildStatusNote(
  outcome: string,
  voteMethod: VoteMethod,
  decided: string
): string {
  const result = outcome === "rejected" ? "否決" : "可決";
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
  docReason: string | null,
  proposalReason: string | null,
  committeeReport: string | null
): string {
  const parts = [`## 議決結果\n\n${statusNote}`];

  // 議案書の理由と、本会議で読み上げられた提案理由説明は別物なので両方載せる。
  // 議案書のほうが正式な文章なので先に置く。
  if (docReason) {
    parts.push(
      `## 議案書に記載された理由\n\n以下は議案書からの引用です。\n\n${asQuote(docReason)}`
    );
  }
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
  parts.push(
    `## 正式な件名\n\n${billName}\n\nここに載せているのは、議案書と会議録に記録された市の説明です。議案書そのものは、この非公式サイトでは再掲載していません。`
  );

  return parts.join("\n\n");
}

/** やさしい説明 */
function buildNormalContent(summary: string, statusNote: string): string {
  return `${summary}\n\n## この議案はどうなったか\n\n${statusNote}\n\nこの説明は、議案書と会議録に記録された市の説明をもとに、AIがわかりやすく書き直したものです。`;
}

export async function seedBillsR8_3(
  supabase: Client,
  sessionId: string,
  tagIdByLabel: Map<string, string>,
  committeeIdByName: Map<string, string>
): Promise<void> {
  const votes = getPublishableBillVotes();

  // ── bills ──
  const billRows = votes.map((v) => {
    const plain = PLAIN_TEXTS[v.billNumber];
    const decided = decidedAt(v.sessionDay);
    return {
      name: v.billName,
      bill_number: v.billNumber,
      bill_type: v.billNumber.startsWith("発議") ? "member_bill" : "bill",
      status: toBillStatus(v.outcome),
      status_note: buildStatusNote(
        v.outcome,
        v.voteMethod as VoteMethod,
        decided
      ),
      vote_method: v.voteMethod,
      published_at: `${submittedAt(v.billNumber)}T00:00:00+09:00`,
      publish_status: "published",
      // 注目の議案は「議会の判断が分かれたもの」で機械的に決める。
      // 特定の議員や立場を目立たせないため、人が選ぶ運用にはしない。
      is_featured: v.outcome === "rejected",
      source_url: R8_3_SOURCE_URL,
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
    throw new Error(`Failed to insert r8-3 bills: ${error.message}`);
  }
  if (!insertedBills) {
    throw new Error("No r8-3 bills were inserted");
  }

  const billIdByNumber = new Map<string, string>(
    insertedBills.map((b: { id: string; bill_number: string }) => [
      b.bill_number,
      b.id,
    ])
  );
  console.log(`✅ Inserted ${insertedBills.length} r8-3 bills`);

  // ── bill_contents（やさしい／くわしい） ──
  const contentRows = votes.flatMap((v) => {
    const billId = billIdByNumber.get(v.billNumber);
    if (!billId) return [];
    const plain = PLAIN_TEXTS[v.billNumber];
    const statusNote = buildStatusNote(
      v.outcome,
      v.voteMethod as VoteMethod,
      decidedAt(v.sessionDay)
    );

    return [
      {
        bill_id: billId,
        difficulty_level: "normal" as const,
        title: plain.title,
        summary: plain.summary,
        content: buildNormalContent(plain.summary, statusNote),
      },
      {
        bill_id: billId,
        difficulty_level: "hard" as const,
        title: v.billName,
        summary: plain.summary,
        content: buildHardContent(
          v.billName,
          statusNote,
          documentReason(v.billNumber),
          v.proposalReason,
          v.committeeReport
        ),
      },
    ];
  });

  const { error: contentError } = await supabase
    .from("bill_contents")
    .insert(contentRows);
  if (contentError) {
    throw new Error(
      `Failed to insert r8-3 bill contents: ${contentError.message}`
    );
  }
  console.log(`✅ Inserted ${contentRows.length} r8-3 bill contents`);

  // ── bills_tags ──
  const tagRows = votes.flatMap((v) => {
    const billId = billIdByNumber.get(v.billNumber);
    const tagId = tagIdByLabel.get(PLAIN_TEXTS[v.billNumber].tag);
    return billId && tagId ? [{ bill_id: billId, tag_id: tagId }] : [];
  });

  const { error: tagError } = await supabase.from("bills_tags").insert(tagRows);
  if (tagError) {
    throw new Error(`Failed to insert r8-3 bills-tags: ${tagError.message}`);
  }
  console.log(`✅ Inserted ${tagRows.length} r8-3 bills-tags relations`);

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
  console.log(`✅ Inserted ${debateRows.length} bill debates`);

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
  console.log(`✅ Inserted ${sponsorRows.length} bill sponsors`);
}
