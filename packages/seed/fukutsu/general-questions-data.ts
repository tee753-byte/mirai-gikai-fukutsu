/**
 * 一般質問シードデータの取りまとめ（福津市版）
 *
 * 定例会が増えたらこの配列に追記する。実データは定例会ごとの別ファイルにある。
 * run.ts はこの配列だけを見るので、定例会を足しても投入処理を直す必要はない。
 */

import { generalQuestionsR8_3, R8_3_SESSION_SLUG, R8_3_SOURCE_URL } from "./general-questions-r8-3";
import { sokatsuShitsugiR8_3 } from "./general-questions-sokatsu-r8-3";
import { generalQuestionsR8_6, R8_6_SESSION_SLUG, R8_6_SOURCE_URL } from "./general-questions-r8-6";
import { generalQuestionsR7_12, R7_12_SESSION_SLUG, R7_12_SOURCE_URL } from "./general-questions-r7-12";
import type {
  SeedSessionQuestions,
  SeedTranscript,
} from "./general-questions-types";
import { digestR8_3 } from "./digest-r8-3";
import { digestR8_3Thick } from "./general-questions-digest-r8-3-thick";
import { digestR7_12 } from "./digest-r7-12";
import { mergeDigest } from "./merge-digest";
import r8_3Transcripts from "./data/r8-3-transcripts.json" with { type: "json" };
import r8_3SokatsuTranscripts from "./data/r8-3-sokatsu-transcripts.json" with { type: "json" };
import r7_12Transcripts from "./data/r7-12-transcripts.json" with { type: "json" };

/**
 * 「やり取りを追う」の粒度。読みやすさを比べるために2種類持っている。
 *   medium … 1発言1〜2文（既定）
 *   thick  … 1発言2〜3文。読み応えはあるが長い
 * 切り替えたらこの値を書き換えて pnpm seed を実行し直す。
 */
// `as` を付けているのは、付けないと TypeScript が値を "medium" だと決めつけてしまい、
// もう一方と比べている行を「ありえない比較」として警告するため
const DIGEST_VARIANT = "medium" as "medium" | "thick";

// 「やり取りを追う」用のダイジェストを topics に流し込む。
// 見出しの誤字などで黙って落ちると気づけないため、突き合わせ漏れは警告する。
const r8_3Merged = mergeDigest(
  generalQuestionsR8_3,
  DIGEST_VARIANT === "thick" ? digestR8_3Thick : digestR8_3
);
if (r8_3Merged.unmatched.length > 0) {
  console.log(
    `⚠️ やり取りダイジェストの突き合わせに失敗しました: ${r8_3Merged.unmatched.join(", ")}`
  );
}

const r7_12Merged = mergeDigest(generalQuestionsR7_12, digestR7_12);
if (r7_12Merged.unmatched.length > 0) {
  console.log(
    `⚠️ やり取りダイジェストの突き合わせに失敗しました: ${r7_12Merged.unmatched.join(", ")}`
  );
}

export type {
  SeedGeneralQuestion,
  SeedSessionQuestions,
  SeedTopic,
  SeedTranscript,
} from "./general-questions-types";
export { ANSWER_PENDING_NOTE } from "./general-questions-r8-6";

export const generalQuestionsBySession: SeedSessionQuestions[] = [
  {
    session_slug: R8_6_SESSION_SLUG,
    source_url: R8_6_SOURCE_URL,
    questions: generalQuestionsR8_6,
    // 議事録が未公開のため、やり取り全文はまだ載せられない
  },
  {
    session_slug: R8_3_SESSION_SLUG,
    source_url: R8_3_SOURCE_URL,
    // 総括質疑（3月9日）は一般質問（3月23〜25日）と実施日が別の会議録ファイルのため、
    // やり取り全文もbuild-sokatsu-transcripts.tsで別に生成している。
    // 同じ会期内で氏名が重複することはない（総括質疑をした議員はその回は一般質問をしない）
    questions: [...r8_3Merged.questions, ...sokatsuShitsugiR8_3],
    transcripts: [
      ...(r8_3Transcripts as SeedTranscript[]),
      ...(r8_3SokatsuTranscripts as SeedTranscript[]),
    ],
  },
  {
    session_slug: R7_12_SESSION_SLUG,
    source_url: R7_12_SOURCE_URL,
    questions: r7_12Merged.questions,
    transcripts: r7_12Transcripts as SeedTranscript[],
  },
];
