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
  BILL_VOTES_R8_4,
  decidedAt as decidedAtR8_4,
  PLAIN_TEXTS as PLAIN_TEXTS_R8_4,
  R8_4_SESSION_SLUG,
  R8_4_SOURCE_URL,
  submittedAt as submittedAtR8_4,
} from "./bills-r8-4";
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
import r7_12BillVotes from "./data/r7-12-bill-votes.json" with { type: "json" };
import r8_1BillVotes from "./data/r8-1-bill-votes.json" with { type: "json" };
import r8_2BillVotes from "./data/r8-2-bill-votes.json" with { type: "json" };
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
  /** 会議録が公開済みか。省略時は公開済み */
  hasMinutes?: boolean;
  /** 議員別の賛否を載せられているか。省略時は載せられている */
  hasMemberVotes?: boolean;
  decidedAt: (sessionDay: number) => string;
  submittedAt: (billNumber: string) => string;
};

export const FUKUTSU_SESSIONS: FukutsuSession[] = [
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
    // 会議録が未公開の会期。件名と議決結果のみを掲載する。
    // 市議会だよりも未公開のため、誰が賛成したかもまだ載せられない
    slug: R8_4_SESSION_SLUG,
    label: "r8-4",
    votes: BILL_VOTES_R8_4,
    plainTexts: PLAIN_TEXTS_R8_4,
    sourceUrl: R8_4_SOURCE_URL,
    documentsFile: "r8-4-bill-documents.json",
    hasMinutes: false,
    hasMemberVotes: false,
    decidedAt: decidedAtR8_4,
    submittedAt: submittedAtR8_4,
  },
];
