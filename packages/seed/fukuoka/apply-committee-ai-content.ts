/**
 * apply-committee-ai-content.ts
 *
 * AI生成した「わかりやすい表現」「要約」を委員会議事録に反映する。
 * docs/data/committee-minutes/<年>/ai/<DocumentID>.json を読み、
 * - committee_meetings.summary（会議全体の要約）
 * - committee_meeting_topics.summary（議題ごとの要約）
 * - committee_meetings.speeches の各発言への simpleText 追記
 * を更新する。
 *
 * 重要: パッチファイルの内容はAI生成物のため、ユーザーの確認を得てから実行すること。
 *
 * 使い方:
 *   cd packages/seed
 *   npx tsx --env-file=../../.env fukuoka/apply-committee-ai-content.ts
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAdminClient } from "../shared/helper";
import type { Speech } from "./parse-committee-minutes";

const TARGET_YEAR = 2026;

const __dirname = dirname(fileURLToPath(import.meta.url));
const AI_DIR = resolve(
  __dirname,
  "../../../docs/data/committee-minutes",
  String(TARGET_YEAR),
  "ai"
);

type AiPatch = {
  documentId: number;
  meetingSummary: string;
  topicSummaries: { topicOrder: number; summary: string }[];
  speechSimpleTexts: { voiceNo: number; simpleText: string }[];
  // 機械抽出で議題が立たない会議（保留質疑・採決など）に手動で議題を与える。
  // 会議に既存議題が1件も無いときだけ挿入する（冪等）。
  manualTopics?: {
    topicOrder: number;
    title: string;
    summary: string;
    startVoiceNo: number;
    endVoiceNo: number;
  }[];
};

async function main(): Promise<void> {
  const supabase = createAdminClient();
  const files = readdirSync(AI_DIR).filter((f) => f.endsWith(".json"));
  console.log(`AIパッチ: ${files.length}件`);

  for (const file of files) {
    const patch: AiPatch = JSON.parse(readFileSync(join(AI_DIR, file), "utf-8"));

    const { data: meeting, error: fetchError } = await supabase
      .from("committee_meetings")
      .select("id, speeches")
      .eq("source_document_id", patch.documentId)
      .single();
    if (fetchError || !meeting) {
      throw new Error(
        `会議が見つかりません (DocumentID=${patch.documentId}): ${fetchError?.message}`
      );
    }

    // 発言にsimpleTextをマージする
    const simpleByVoiceNo = new Map(
      patch.speechSimpleTexts.map((s) => [s.voiceNo, s.simpleText])
    );
    const speeches = (meeting.speeches as Speech[]).map((s) => {
      const simpleText = simpleByVoiceNo.get(s.voiceNo);
      return simpleText ? { ...s, simpleText } : s;
    });

    const { error: updateError } = await supabase
      .from("committee_meetings")
      .update({ summary: patch.meetingSummary, speeches })
      .eq("id", meeting.id);
    if (updateError) {
      throw new Error(
        `会議の更新に失敗 (DocumentID=${patch.documentId}): ${updateError.message}`
      );
    }

    for (const topic of patch.topicSummaries) {
      const { error: topicError } = await supabase
        .from("committee_meeting_topics")
        .update({ summary: topic.summary })
        .eq("meeting_id", meeting.id)
        .eq("topic_order", topic.topicOrder);
      if (topicError) {
        throw new Error(
          `議題の更新に失敗 (DocumentID=${patch.documentId}, order=${topic.topicOrder}): ${topicError.message}`
        );
      }
    }

    // 手動議題: 既存議題が0件のときだけ挿入（冪等）
    let insertedManual = 0;
    if (patch.manualTopics && patch.manualTopics.length > 0) {
      const { count, error: countError } = await supabase
        .from("committee_meeting_topics")
        .select("id", { count: "exact", head: true })
        .eq("meeting_id", meeting.id);
      if (countError) {
        throw new Error(
          `議題数の取得に失敗 (DocumentID=${patch.documentId}): ${countError.message}`
        );
      }
      if ((count ?? 0) === 0) {
        const rows = patch.manualTopics.map((t) => ({
          meeting_id: meeting.id,
          topic_order: t.topicOrder,
          title: t.title,
          summary: t.summary,
          start_voice_no: t.startVoiceNo,
          end_voice_no: t.endVoiceNo,
        }));
        const { error: insertError } = await supabase
          .from("committee_meeting_topics")
          .insert(rows);
        if (insertError) {
          throw new Error(
            `手動議題の挿入に失敗 (DocumentID=${patch.documentId}): ${insertError.message}`
          );
        }
        insertedManual = rows.length;
      }
    }

    console.log(
      `反映: DocumentID=${patch.documentId}（議題${patch.topicSummaries.length}件更新` +
        (insertedManual > 0 ? `・手動議題${insertedManual}件挿入` : "") +
        `・発言${patch.speechSimpleTexts.length}件）`
    );
  }

  console.log("完了");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
