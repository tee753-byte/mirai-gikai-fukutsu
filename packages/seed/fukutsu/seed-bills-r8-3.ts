/**
 * 令和8年3月定例会の議案を投入する。
 *
 * 会議録から取れる事実（議決結果・採決のとり方・討論・提出者/賛成者）と、
 * それをもとにAIが書いた平易な要約を、議案ごとに同じ項目で入れる。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildHardContent, buildNormalContent } from "./bill-content-format";
import {
  decidedAt,
  documentReason,
  getPublishableBillVotes,
  PLAIN_TEXTS,
  R8_3_SOURCE_URL,
  submittedAt,
} from "./bills-r8-3";
import { findMemberParty } from "./members";
import {
  cutToOwnItem,
  describeVoteMethod,
  type VoteMethod,
} from "./parse-bill-votes";

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

/** 本文の組み立てに渡す前提。この会期は会議録も市議会だよりも公開済み */
function toContentInput(
  billNumber: string,
  billName: string,
  reasonPlain: string | undefined,
  docReason: string | null,
  proposalReason: string | null,
  committeeReport: string | null
) {
  return {
    subject: "議案",
    billName,
    reasonPlain,
    // 提案理由を説明したのが市か提出議員かで見出しの主語が変わる
    isMemberBill: billNumber.startsWith("発議"),
    documentReason: docReason,
    proposalReason,
    // 委員長は付託された案件を続けて読み上げる。他の案件の審査内容が
    // このページに出ないよう、自分の案件のぶんだけに絞る
    committeeReport: committeeReport ? cutToOwnItem(committeeReport) : null,
    sources: [
      { label: "この定例会のページ（福津市公式）", url: R8_3_SOURCE_URL },
    ],
    hasMinutes: true,
    hasMemberVotes: true,
    minutesDueLabel: null,
    // 発議は市ではなく議員が出したもの。「市の説明」と書くと出典を偽ることになる
    aiSourceLabel: billNumber.startsWith("発議")
      ? "議案書と会議録に記録された提出議員の説明"
      : "議案書と会議録に記録された市の説明",
    originalDocumentNote:
      "ここに載せているのは、議案書と会議録に記録された市の説明です。議案書そのものは、この非公式サイトでは再掲載していません。",
  };
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

    const contentInput = toContentInput(
      v.billNumber,
      v.billName,
      plain.reasonPlain,
      documentReason(v.billNumber),
      v.proposalReason,
      v.committeeReport
    );

    return [
      {
        bill_id: billId,
        difficulty_level: "normal" as const,
        title: plain.title,
        summary: plain.summary,
        content: buildNormalContent(contentInput),
      },
      {
        bill_id: billId,
        difficulty_level: "hard" as const,
        title: v.billName,
        summary: plain.summary,
        content: buildHardContent(contentInput),
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
