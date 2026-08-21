/**
 * 一般質問シードデータの取りまとめ（福津市版）
 *
 * 定例会が増えたらこの配列に追記する。実データは定例会ごとの別ファイルにある。
 * run.ts はこの配列だけを見るので、定例会を足しても投入処理を直す必要はない。
 */

import { generalQuestionsR8_3, R8_3_SESSION_SLUG, R8_3_SOURCE_URL } from "./general-questions-r8-3";
import { sokatsuShitsugiR8_3 } from "./general-questions-sokatsu-r8-3";
import { sokatsuShitsugiR7_6 } from "./general-questions-sokatsu-r7-6";
import { generalQuestionsR8_6, R8_6_SESSION_SLUG, R8_6_SOURCE_URL } from "./general-questions-r8-6";
import { generalQuestionsR7_12, R7_12_SESSION_SLUG, R7_12_SOURCE_URL } from "./general-questions-r7-12";
import { generalQuestionsR7_9, R7_9_SESSION_SLUG, R7_9_SOURCE_URL } from "./general-questions-r7-9";
import { generalQuestionsR7_6, R7_6_SESSION_SLUG, R7_6_SOURCE_URL } from "./general-questions-r7-6";
import type {
  SeedSessionQuestions,
  SeedTranscript,
} from "./general-questions-types";
import { digestR8_3 } from "./digest-r8-3";
import { digestR8_3Thick } from "./general-questions-digest-r8-3-thick";
import { digestR8_6 } from "./digest-r8-6";
import { digestR7_12 } from "./digest-r7-12";
import { digestR7_9 } from "./digest-r7-9";
import { digestR7_6 } from "./digest-r7-6";
import { digestSokatsuR7_6 } from "./digest-sokatsu-r7-6";
import { digestSokatsuR8_3 } from "./digest-sokatsu-r8-3";
import { mergeDigest } from "./merge-digest";
import r8_3Transcripts from "./data/r8-3-transcripts.json" with { type: "json" };
import r8_3SokatsuTranscripts from "./data/r8-3-sokatsu-transcripts.json" with { type: "json" };
import r7_12Transcripts from "./data/r7-12-transcripts.json" with { type: "json" };
import r7_9Transcripts from "./data/r7-9-transcripts.json" with { type: "json" };
import r7_6Transcripts from "./data/r7-6-transcripts.json" with { type: "json" };
import r8_6Transcripts from "./data/r8-6-transcripts.json" with { type: "json" };
import r7_6SokatsuTranscripts from "./data/r7-6-sokatsu-transcripts.json" with { type: "json" };

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

const r8_6Merged = mergeDigest(generalQuestionsR8_6, digestR8_6);
if (r8_6Merged.unmatched.length > 0) {
  console.log(
    `⚠️ やり取りダイジェストの突き合わせに失敗しました: ${r8_6Merged.unmatched.join(", ")}`
  );
}

const r7_12Merged = mergeDigest(generalQuestionsR7_12, digestR7_12);
if (r7_12Merged.unmatched.length > 0) {
  console.log(
    `⚠️ やり取りダイジェストの突き合わせに失敗しました: ${r7_12Merged.unmatched.join(", ")}`
  );
}

const r7_9Merged = mergeDigest(generalQuestionsR7_9, digestR7_9);
if (r7_9Merged.unmatched.length > 0) {
  console.log(
    `⚠️ やり取りダイジェストの突き合わせに失敗しました: ${r7_9Merged.unmatched.join(", ")}`
  );
}

const r7_6Merged = mergeDigest(generalQuestionsR7_6, digestR7_6);
if (r7_6Merged.unmatched.length > 0) {
  console.log(
    `⚠️ やり取りダイジェストの突き合わせに失敗しました: ${r7_6Merged.unmatched.join(", ")}`
  );
}

const sokatsuR8_3Merged = mergeDigest(sokatsuShitsugiR8_3, digestSokatsuR8_3);
if (sokatsuR8_3Merged.unmatched.length > 0) {
  console.log(
    `⚠️ 総括質疑のやり取りダイジェストの突き合わせに失敗しました: ${sokatsuR8_3Merged.unmatched.join(", ")}`
  );
}

const sokatsuR7_6Merged = mergeDigest(sokatsuShitsugiR7_6, digestSokatsuR7_6);
if (sokatsuR7_6Merged.unmatched.length > 0) {
  console.log(
    `⚠️ 総括質疑のやり取りダイジェストの突き合わせに失敗しました: ${sokatsuR7_6Merged.unmatched.join(", ")}`
  );
}

export type {
  SeedGeneralQuestion,
  SeedSessionQuestions,
  SeedTopic,
  SeedTranscript,
} from "./general-questions-types";

export const generalQuestionsBySession: SeedSessionQuestions[] = [
  {
    session_slug: R8_6_SESSION_SLUG,
    source_url: R8_6_SOURCE_URL,
    questions: r8_6Merged.questions,
    transcripts: r8_6Transcripts as SeedTranscript[],
  },
  {
    session_slug: R8_3_SESSION_SLUG,
    source_url: R8_3_SOURCE_URL,
    // 総括質疑（3月9日）は一般質問（3月23〜25日）と実施日が別の会議録ファイルのため、
    // やり取り全文もbuild-sokatsu-transcripts.tsで別に生成している。
    // 同じ会期内で氏名が重複することはない（総括質疑をした議員はその回は一般質問をしない）
    questions: [...r8_3Merged.questions, ...sokatsuR8_3Merged.questions],
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
  {
    session_slug: R7_9_SESSION_SLUG,
    source_url: R7_9_SOURCE_URL,
    questions: r7_9Merged.questions,
    transcripts: r7_9Transcripts as SeedTranscript[],
  },
  {
    session_slug: R7_6_SESSION_SLUG,
    source_url: R7_6_SOURCE_URL,
    // 所信表明に対する総括質疑（6月17〜18日）は一般質問（6月24〜26日）と
    // 実施日も会議録ファイルも別のため、やり取り全文も別に生成している。
    // 総括質疑に立った6人はこの回の一般質問には登壇していない
    questions: [...r7_6Merged.questions, ...sokatsuR7_6Merged.questions],
    transcripts: [
      ...(r7_6Transcripts as SeedTranscript[]),
      ...(r7_6SokatsuTranscripts as SeedTranscript[]),
    ],
  },
];
