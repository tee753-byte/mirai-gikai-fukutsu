/**
 * 会議録から作った会期のデータをひとまとめにする。
 *
 * run.ts の中に直接書いてあったものを切り出した。全件を入れ直す run.ts と、
 * 1会期だけを入れ替える seed-session.ts の両方が同じ定義を見るようにするため。
 * 定例会を足すときは、ここに1つ追加すれば両方に反映される。
 *
 * 令和8年3月定例会（r8-3）だけはここに入れていない。先に個別実装した
 * seed-bills-r8-3.ts があり、予算データもこの会期にだけ紐づいているため。
 */
import {
  decidedAt as decidedAtR8_4,
  PLAIN_TEXTS as PLAIN_TEXTS_R8_4,
  R8_4_SESSION_SLUG,
  R8_4_SOURCE_URL,
  submittedAt as submittedAtR8_4,
} from "./bills-r8-4";
import {
  decidedAt as decidedAtR8_6,
  PLAIN_TEXTS as PLAIN_TEXTS_R8_6,
  R8_6_KETSUGI_PDF_URL,
  R8_6_SESSION_SLUG,
  R8_6_SOURCE_URL,
  submittedAt as submittedAtR8_6,
} from "./bills-r8-6";
import {
  decidedAt as decidedAtR7_12,
  PLAIN_TEXTS as PLAIN_TEXTS_R7_12,
  R7_12_SESSION_SLUG,
  R7_12_SOURCE_URL,
  sanitizeR7_12Debates,
  submittedAt as submittedAtR7_12,
} from "./bills-r7-12";
import {
  decidedAt as decidedAtR8_1,
  PLAIN_TEXTS as PLAIN_TEXTS_R8_1,
  R8_1_SESSION_SLUG,
  R8_1_SOURCE_URL,
  submittedAt as submittedAtR8_1,
} from "./bills-r8-1";
import {
  decidedAt as decidedAtR8_2,
  PLAIN_TEXTS as PLAIN_TEXTS_R8_2,
  R8_2_SESSION_SLUG,
  R8_2_SOURCE_URL,
  submittedAt as submittedAtR8_2,
} from "./bills-r8-2";
import {
  decidedAt as decidedAtR7_6,
  PLAIN_TEXTS as PLAIN_TEXTS_R7_6,
  R7_6_SESSION_SLUG,
  R7_6_SOURCE_URL,
  sanitizeR7_6Debates,
  submittedAt as submittedAtR7_6,
} from "./bills-r7-6";
import {
  decidedAt as decidedAtR7_9,
  PLAIN_TEXTS as PLAIN_TEXTS_R7_9,
  R7_9_SESSION_SLUG,
  R7_9_SOURCE_URL,
  sanitizeR7_9Debates,
  submittedAt as submittedAtR7_9,
} from "./bills-r7-9";
import r7_6BillVotes from "./data/r7-6-bill-votes.json" with { type: "json" };
import r7_9BillVotes from "./data/r7-9-bill-votes.json" with { type: "json" };
import r7_12BillVotes from "./data/r7-12-bill-votes.json" with { type: "json" };
import r8_1BillVotes from "./data/r8-1-bill-votes.json" with { type: "json" };
import r8_2BillVotes from "./data/r8-2-bill-votes.json" with { type: "json" };
import r8_4BillVotes from "./data/r8-4-bill-votes.json" with { type: "json" };
import r8_6BillVotes from "./data/r8-6-bill-votes.json" with { type: "json" };
import {
  buildPetitionsR7_6,
  PETITION_PLAIN_TEXTS_R7_6,
} from "./petitions-r7-6";
import {
  buildPetitionsR7_9,
  PETITION_PLAIN_TEXTS_R7_9,
} from "./petitions-r7-9";
import {
  buildPetitionsR7_12,
  PETITION_PLAIN_TEXTS_R7_12,
} from "./petitions-r7-12";
import type { BillVoteRecord, PlainText } from "./seed-bills-common";

export type FukutsuSession = {
  /** council_sessions.slug */
  slug: string;
  /** ログ出力に使う会期の呼び名 */
  label: string;
  votes: BillVoteRecord[];
  plainTexts: Record<string, PlainText>;
  sourceUrl: string;
  /** 議案書から抽出した理由のファイル名 */
  documentsFile: string;
  /** 本文の「元の資料」に並べるリンク。省略時は会期のページだけを載せる */
  sources?: { label: string; url: string }[];
  /** 会議録が公開済みか。省略時は公開済み */
  hasMinutes?: boolean;
  /** 議員別の賛否を載せられているか。省略時は載せられている */
  hasMemberVotes?: boolean;
  decidedAt: (sessionDay: number) => string;
  submittedAt: (billNumber: string) => string;
};

export const FUKUTSU_SESSIONS: FukutsuSession[] = [
  {
    // 6月定例会は新市長の所信表明に対する総括質疑と、骨格予算に政策的経費を足す
    // 肉付け補正予算（議案第29号）が中心。請願第1号も同じ流れで投入する
    slug: R7_6_SESSION_SLUG,
    label: "r7-6",
    votes: [
      // biome-ignore lint/suspicious/noExplicitAny: JSON importの型をBillVoteRecord[]に合わせるための簡易キャスト
      ...sanitizeR7_6Debates(r7_6BillVotes as any),
      // biome-ignore lint/suspicious/noExplicitAny: 同上
      ...buildPetitionsR7_6(r7_6BillVotes as any),
    ],
    plainTexts: {
      ...PLAIN_TEXTS_R7_6,
      ...PETITION_PLAIN_TEXTS_R7_6,
    },
    sourceUrl: R7_6_SOURCE_URL,
    documentsFile: "r7-6-bill-documents.json",
    decidedAt: decidedAtR7_6,
    submittedAt: submittedAtR7_6,
  },
  {
    // 9月定例会は決算議会を兼ねる（認定第1〜5号）。請願第2号も同じ流れで投入する
    slug: R7_9_SESSION_SLUG,
    label: "r7-9",
    votes: [
      // biome-ignore lint/suspicious/noExplicitAny: JSON importの型をBillVoteRecord[]に合わせるための簡易キャスト
      ...sanitizeR7_9Debates(r7_9BillVotes as any),
      // biome-ignore lint/suspicious/noExplicitAny: 同上
      ...buildPetitionsR7_9(r7_9BillVotes as any),
    ],
    plainTexts: {
      ...PLAIN_TEXTS_R7_9,
      ...PETITION_PLAIN_TEXTS_R7_9,
    },
    sourceUrl: R7_9_SOURCE_URL,
    documentsFile: "r7-9-bill-documents.json",
    decidedAt: decidedAtR7_9,
    submittedAt: submittedAtR7_9,
  },
  {
    slug: R7_12_SESSION_SLUG,
    label: "r7-12",
    // 議案・発議に加えて請願2件も同じ流れで投入する（bill_type = 'petition'）
    votes: [
      // biome-ignore lint/suspicious/noExplicitAny: JSON importの型をBillVoteRecord[]に合わせるための簡易キャスト
      ...sanitizeR7_12Debates(r7_12BillVotes as any),
      // biome-ignore lint/suspicious/noExplicitAny: 同上
      ...buildPetitionsR7_12(r7_12BillVotes as any),
    ],
    plainTexts: {
      ...PLAIN_TEXTS_R7_12,
      ...PETITION_PLAIN_TEXTS_R7_12,
    },
    sourceUrl: R7_12_SOURCE_URL,
    documentsFile: "r7-12-bill-documents.json",
    decidedAt: decidedAtR7_12,
    submittedAt: submittedAtR7_12,
  },
  {
    slug: R8_1_SESSION_SLUG,
    label: "r8-1",
    // biome-ignore lint/suspicious/noExplicitAny: 同上
    votes: r8_1BillVotes as any,
    plainTexts: PLAIN_TEXTS_R8_1,
    sourceUrl: R8_1_SOURCE_URL,
    documentsFile: "r8-1-bill-documents.json",
    decidedAt: decidedAtR8_1,
    submittedAt: submittedAtR8_1,
  },
  {
    slug: R8_2_SESSION_SLUG,
    label: "r8-2",
    // biome-ignore lint/suspicious/noExplicitAny: 同上
    votes: r8_2BillVotes as any,
    plainTexts: PLAIN_TEXTS_R8_2,
    sourceUrl: R8_2_SOURCE_URL,
    documentsFile: "r8-2-bill-documents.json",
    decidedAt: decidedAtR8_2,
    submittedAt: submittedAtR8_2,
  },
  {
    // 会議録は令和8年8月20日に公開済み。市議会だよりはまだ出ていないため、
    // 誰が賛成したかは載せられない
    slug: R8_4_SESSION_SLUG,
    label: "r8-4",
    // biome-ignore lint/suspicious/noExplicitAny: 同上
    votes: r8_4BillVotes as any,
    plainTexts: PLAIN_TEXTS_R8_4,
    sourceUrl: R8_4_SOURCE_URL,
    documentsFile: "r8-4-bill-documents.json",
    hasMemberVotes: false,
    decidedAt: decidedAtR8_4,
    submittedAt: submittedAtR8_4,
  },
  {
    // 会議録は令和8年8月20日に公開済み。市議会だよりはまだ出ていないため、
    // 誰が賛成したかは載せられない。
    // 会議録の公開前は main/data.ts 側（Fork元から引き継いだ経路）に置いていた
    slug: R8_6_SESSION_SLUG,
    label: "r8-6",
    // biome-ignore lint/suspicious/noExplicitAny: 同上
    votes: r8_6BillVotes as any,
    plainTexts: PLAIN_TEXTS_R8_6,
    sourceUrl: R8_6_SOURCE_URL,
    documentsFile: "r8-6-bill-documents.json",
    sources: [
      {
        label: "令和8年6月定例会のページ（福津市公式）",
        url: R8_6_SOURCE_URL,
      },
      {
        label: "議決結果一覧（PDF・福津市公式）",
        url: R8_6_KETSUGI_PDF_URL,
      },
    ],
    hasMemberVotes: false,
    decidedAt: decidedAtR8_6,
    submittedAt: submittedAtR8_6,
  },
];
