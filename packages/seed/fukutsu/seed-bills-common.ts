/**
 * 会議録から作った議案データ（bills-r8-3.tsと同じ形）を投入する共通処理。
 *
 * r8-3は先に個別実装済み（seed-bills-r8-3.ts）のためそのまま残し、
 * それ以降に追加する会期（r7-12・r8-1・r8-2など）はこちらを共有する。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type BillContentSource,
  buildHardContent,
  buildNormalContent,
} from "./bill-content-format";
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
  /** 本文の「元の資料」に並べるリンク。市が公開しているものだけを渡す */
  sources?: BillContentSource[];
  /**
   * 会議録が公開済みか。未公開の会期では質疑・討論を載せられないため、
   * その旨を記事に明記する。省略時は公開済みとして扱う
   */
  hasMinutes?: boolean;
  /**
   * 議員別の賛否を載せられているか。市が公開する議決結果の資料には
   * 可決・否決しか載らず、誰が賛成したかは市議会だよりを待つ必要がある
   */
  hasMemberVotes?: boolean;
  /** 会議録の公開見込み。例:「令和8年9月ごろ」 */
  minutesDueLabel?: string | null;
  /** 会議録の何日目に議決されたかから、議決日（YYYY-MM-DD）を返す */
  decidedAt: (sessionDay: number) => string;
  /** 議案番号から、上程日（YYYY-MM-DD）を返す */
  submittedAt: (billNumber: string) => string;
};

/** 請願かどうか。請願は議案と議決の言い方が違う（可決／否決ではなく採択／不採択） */
function isPetition(billNumber: string): boolean {
  return billNumber.startsWith("請願");
}

/**
 * 専決処分の承認案件かどうか。
 * 市長が議会を待たずに決めた事柄を、あとから議会が認めるかどうかを議決するもので、
 * 結果の言い方は可決／否決ではなく承認／不承認になる。
 */
function isApprovalItem(billNumber: string): boolean {
  return billNumber.startsWith("承認");
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
  voteMethod: VoteMethod | null,
  decided: string,
  billNumber: string
): string {
  const rejected = outcome === "rejected";
  let result: string;
  if (isPetition(billNumber)) {
    result = rejected ? "不採択" : "採択";
  } else if (isApprovalItem(billNumber)) {
    result = rejected ? "不承認" : "承認";
  } else {
    result = rejected ? "否決" : "可決";
  }

  const [y, m, d] = decided.split("-").map(Number);
  const wareki = y - 2018; // 2019年が令和元年
  const base = `令和${wareki}年${m}月${d}日の本会議で${result}`;

  // 採決の方法は会議録にしか残らない。会議録が未公開の会期では分からないので、
  // 分かっている場合だけ添える（推測で書かない）
  return voteMethod ? `${base}／${describeVoteMethod(voteMethod)}` : base;
}

/**
 * 本文の組み立てに渡す、会期と議案ごとの前提をまとめる。
 *
 * 請願は市民が提出するものなので「市の説明」ではない。請願書そのものも
 * 非公開資料のため、載せているのが会議録の記録だけであることを明示する。
 */
function toContentInput(
  billName: string,
  billNumber: string,
  statusNote: string,
  proposalReason: string | null,
  committeeReport: string | null,
  sources: BillContentSource[],
  hasMinutes: boolean,
  hasMemberVotes: boolean,
  minutesDueLabel: string | null
) {
  const petition = isPetition(billNumber);
  return {
    subject: petition ? "請願" : "議案",
    billName,
    statusNote,
    proposalReason,
    committeeReport,
    sources,
    hasMinutes,
    hasMemberVotes,
    minutesDueLabel,
    aiSourceLabel: petition
      ? "会議録に記録された委員会での審査内容"
      : "会議録に記録された市の説明",
    originalDocumentNote: petition
      ? "ここに載せているのは、会議録に記録された委員会での審査内容と議決結果です。請願書そのもの（請願の趣旨・請願人）は、この非公式サイトでは掲載していません。"
      : "ここに載せているのは、会議録に記録された市の説明です。議案書そのものは、この非公式サイトでは再掲載していません。",
  };
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
  sources,
  hasMinutes = true,
  hasMemberVotes = true,
  minutesDueLabel = null,
  decidedAt,
  submittedAt,
}: SeedBillsForSessionInput): Promise<{ id: string; bill_number: string }[]> {
  // 「元の資料」に出すリンク。指定が無ければ会期のページだけを載せる
  const contentSources: BillContentSource[] = sources ?? [
    { label: "この定例会のページ（福津市公式）", url: sourceUrl },
  ];
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
        (v.voteMethod as VoteMethod | null) ?? null,
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
      (v.voteMethod as VoteMethod | null) ?? null,
      decidedAt(v.sessionDay),
      v.billNumber
    );

    const contentInput = toContentInput(
      v.billName,
      v.billNumber,
      statusNote,
      v.proposalReason ?? null,
      v.committeeReport ?? null,
      contentSources,
      hasMinutes,
      hasMemberVotes,
      minutesDueLabel
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
