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
import { loadBillDocuments, toReasonMap } from "./load-bill-documents";
import { findMemberParty } from "./members";
import {
  type BillVote,
  cutToOwnItem,
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

/**
 * 令和8年度の主要事業をまとめたページ。
 * 市が公開している「令和8年度 主要事業の概要」（37事業）をもとにしている。
 */
const BUDGET_PAGE_PATH = "/budget/r8-3/shuyo-jigyo";

/**
 * 予算の議案に置く、しくみの説明。
 *
 * 予算の議案には議案書に理由欄が無い。地方自治法で市長が予算を調製して
 * 議会に提出することが定められており、理由を述べる制度になっていないため。
 * 空欄のままだと資料に無いのか載せ忘れなのかが読み手に区別できないので、
 * 何の議案なのかを説明する。
 *
 * @param kind 予算の種類（当初予算か補正予算か）
 * @param account 会計の名前。「市全体のお金（一般会計）」など
 * @param linkBudgetPage 主要事業のページへ案内するか。令和8年度の一般会計だけ
 */
export function budgetSystemNote(o: {
  kind: "当初予算" | "補正予算";
  account: string;
  linkBudgetPage?: boolean;
}): string {
  const base =
    o.kind === "当初予算"
      ? `市が1年間に行う仕事と、それに使うお金をまとめて決める議案です。${o.account}が対象です。`
      : `すでに決めてある1年ぶんの予算を、年度の途中で組み替える議案です。${o.account}が対象です。`;

  const why =
    "予算の議案には、議案書に理由が書かれていません。地方自治法で、市長が予算をつくって議会に提出し、議決を受けることが定められているためです。";

  const link = o.linkBudgetPage
    ? `\n\nこの予算に含まれる主な事業は、市が公開している「令和8年度 主要事業の概要」をもとに[別のページ](${BUDGET_PAGE_PATH})にまとめています。`
    : "";

  return `${base}\n\n${why}${link}`;
}

/**
 * 工事の契約や財産の取得の議案に置く、しくみの説明。
 *
 * これらの議案書は「契約の目的・工事の名称・場所・工期・契約金額・請負業者・
 * 契約の方法」を並べた表の形で、予算と同じく理由欄が無い。市長が理由を
 * 書き落としたのではなく、契約の中身そのものが議案の本体だからである。
 *
 * 会議録が公開されれば市長の提案理由説明が付くが、それまでの数か月間、
 * ページが空のままだと「資料に無いのか、載せ忘れなのか」が読み手に
 * 区別できない。何の議案なのかだけでも先に伝える。
 *
 * 何を買うのか・いくらなのかは要約に書く。ここは要約に書けないこと
 * （なぜ議会にかかるのか、なぜ理由が無いのか）だけを担当する。
 *
 * @param hasMinutes 会議録が公開済みか。未公開なら説明が後から増えることを添える
 */
export function contractSystemNote(o: { hasMinutes: boolean }): string {
  const why =
    "一定の規模を超える契約や財産の取得は、市長だけでは決められず、議会の議決が必要だと地方自治法で定められています。金額の基準は市の条例で決めています。";

  const noReason =
    "この種類の議案書には、条例の議案のような「理由」欄がありません。契約の相手方・金額・工期といった契約の中身そのものが議案の本体になっているためです。";

  const due = o.hasMinutes
    ? ""
    : "\n\n市長が議会で述べた提案理由の説明は、会議録が公開されてから追加します。";

  return `${why}\n\n${noReason}${due}`;
}

export type PlainText = {
  /** 市民向けの見出し */
  title: string;
  /** 市民向けの要約。会議録の提案理由説明をもとに平易に書き直したもの */
  summary: string;
  /**
   * やさしい版の「なぜ出されたのか」に載せる本文。
   * 議案書の理由と提案理由説明をもとに平易に書き直したもので、原文ではない。
   * 理由がそもそも記録されていない議案（予算など）は省略する。
   */
  reasonPlain?: string;
  /**
   * 理由の記録が無い議案（予算など）に置く、しくみの説明。
   * budgetSystemNote() で組み立てる。
   */
  systemNote?: string;
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
  /**
   * 議案書から抽出した理由のファイル名。例: "r7-12-bill-documents.json"
   *
   * このファイルはリポジトリに入れていない（個人情報を含みうるため）ので、
   * 無い環境では警告を出したうえで理由なしとして扱われる。
   * 請願は請願書そのものが非公開資料のため、このファイルには含めない。
   */
  documentsFile?: string;
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
 * 記事が何をもとに書かれたかの一文。議案ごとに実際にある資料から決める。
 *
 * 会議録が未公開の会期や、理由欄が無い予算議案では、もとにできる資料が
 * 議案ごとに違う。一律の文言にすると、読み手に何を根拠に書かれた記事なのかを
 * 誤って伝えることになる。
 */
export function buildAiSourceLabel(o: {
  petition: boolean;
  memberBill: boolean;
  hasDocumentReason: boolean;
  hasProposalReason: boolean;
}): string {
  // 請願は市民が提出するもの。市の説明でも提出議員の説明でもない
  if (o.petition) return "会議録に記録された委員会での審査内容";

  const speaker = o.memberBill ? "提出議員" : "市";
  if (o.hasDocumentReason && o.hasProposalReason) {
    return `議案書と会議録に記録された${speaker}の説明`;
  }
  if (o.hasDocumentReason) return "議案書に記載された理由";
  if (o.hasProposalReason) return `会議録に記録された${speaker}の説明`;

  // 予算議案には理由欄が無く、会議録にも提案理由の説明が残っていないことがある
  return "福津市が公開している議案一覧と議決結果";
}

/**
 * 本文の組み立てに渡す、会期と議案ごとの前提をまとめる。
 *
 * 請願は市民が提出するものなので「市の説明」ではない。請願書そのものも
 * 非公開資料のため、載せているのが会議録の記録だけであることを明示する。
 */
function toContentInput(o: {
  billName: string;
  billNumber: string;
  reasonPlain: string | undefined;
  systemNote: string | undefined;
  documentReason: string | null;
  proposalReason: string | null;
  committeeReport: string | null;
  sources: BillContentSource[];
  hasMinutes: boolean;
  hasMemberVotes: boolean;
  minutesDueLabel: string | null;
}) {
  const petition = isPetition(o.billNumber);
  const memberBill = o.billNumber.startsWith("発議");

  return {
    subject: petition ? "請願" : "議案",
    billName: o.billName,
    reasonPlain: o.reasonPlain,
    systemNote: o.systemNote,
    // 提案理由を説明したのが市か提出議員かで見出しの主語が変わる
    isMemberBill: memberBill,
    documentReason: o.documentReason,
    proposalReason: o.proposalReason,
    // 委員長は付託された案件を続けて読み上げる。他の案件の審査内容が
    // このページに出ないよう、自分の案件のぶんだけに絞る
    committeeReport: o.committeeReport
      ? cutToOwnItem(o.committeeReport)
      : o.committeeReport,
    sources: o.sources,
    hasMinutes: o.hasMinutes,
    hasMemberVotes: o.hasMemberVotes,
    minutesDueLabel: o.minutesDueLabel,
    aiSourceLabel: buildAiSourceLabel({
      petition,
      memberBill,
      hasDocumentReason: Boolean(o.documentReason),
      hasProposalReason: Boolean(o.proposalReason),
    }),
    originalDocumentNote: petition
      ? "ここに載せているのは、会議録に記録された委員会での審査内容と議決結果です。請願書そのもの（請願の趣旨・請願人）は、この非公式サイトでは掲載していません。"
      : `ここに載せているのは、${o.documentReason ? "議案書と会議録に記録された" : "会議録に記録された"}${memberBill ? "提出議員" : "市"}の説明です。議案書そのものは、この非公式サイトでは再掲載していません。`,
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
  documentsFile,
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
  // 議案書に印刷されている理由。ファイルが無ければ空（load側が警告を出す）
  const documentReasons = documentsFile
    ? toReasonMap(loadBillDocuments(documentsFile))
    : new Map<string, string | null>();
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

    const contentInput = toContentInput({
      billName: v.billName,
      billNumber: v.billNumber,
      reasonPlain: plain.reasonPlain,
      systemNote: plain.systemNote,
      // 請願は請願書そのものが非公開資料なので、議案書の理由は持たない
      documentReason: documentReasons.get(v.billNumber) ?? null,
      proposalReason: v.proposalReason ?? null,
      committeeReport: v.committeeReport ?? null,
      sources: contentSources,
      hasMinutes,
      hasMemberVotes,
      minutesDueLabel,
    });

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
