/**
 * seed-committee-meetings.ts
 *
 * スクレイパーが保存した委員会議事録JSON（docs/data/committee-minutes/<年>/）を
 * committee_meetings / committee_meeting_topics に投入する。
 *
 * - 会議録の原文・発言・機械抽出した議題タイトルのみを投入する（AI生成なし）
 * - AI要約（summary / discussion_summary）はPhase 2でユーザー確認後に更新する
 * - source_document_id で既存行を確認し、登録済みの会議はスキップする
 *
 * 使い方:
 *   cd packages/seed
 *   npx tsx --env-file=../../.env fukuoka/seed-committee-meetings.ts
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAdminClient } from "../shared/helper";
import { extractTopics, type Speech } from "./parse-committee-minutes";

const TARGET_YEAR = 2026;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(
  __dirname,
  "../../../docs/data/committee-minutes",
  String(TARGET_YEAR)
);

/** スクレイパーが出力するJSONのシェイプ */
type MeetingJson = {
  documentId: number;
  title: string;
  committee: {
    dbsrName: string;
    currentName: string;
    slug: string;
    type: string;
    cabinetId: number;
  };
  meetingDate: string;
  sourceUrl: string;
  scrapedAt: string;
  speechCount: number;
  speeches: Speech[];
  rawText: string;
};

async function main(): Promise<void> {
  const supabase = createAdminClient();

  // 常任委員会は committees の現行名で紐付ける（特別委等は未登録のためnull）
  const { data: committees, error: committeesError } = await supabase
    .from("committees")
    .select("id, name");
  if (committeesError) {
    throw new Error(`committeesの取得に失敗: ${committeesError.message}`);
  }
  const committeeIdByName = new Map(committees.map((c) => [c.name, c.id]));

  const files = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  console.log(`対象ファイル: ${files.length}件`);

  let inserted = 0;
  let skipped = 0;
  let topicCount = 0;

  for (const file of files) {
    const meeting: MeetingJson = JSON.parse(
      readFileSync(join(DATA_DIR, file), "utf-8")
    );

    const { data: existing, error: existingError } = await supabase
      .from("committee_meetings")
      .select("id")
      .eq("source_document_id", meeting.documentId)
      .maybeSingle();
    if (existingError) {
      throw new Error(`既存確認に失敗 (${file}): ${existingError.message}`);
    }
    if (existing) {
      skipped++;
      continue;
    }

    const { data: insertedMeeting, error: meetingError } = await supabase
      .from("committee_meetings")
      .insert({
        committee_id:
          committeeIdByName.get(meeting.committee.currentName) ?? null,
        committee_name: meeting.committee.dbsrName,
        committee_slug: meeting.committee.slug,
        meeting_date: meeting.meetingDate,
        title: meeting.title,
        source_document_id: meeting.documentId,
        source_url: meeting.sourceUrl,
        speeches: meeting.speeches,
        raw_text: meeting.rawText,
        publish_status: "draft",
      })
      .select("id")
      .single();
    if (meetingError) {
      throw new Error(`会議の投入に失敗 (${file}): ${meetingError.message}`);
    }

    const topics = extractTopics(meeting.speeches);
    if (topics.length > 0) {
      const { error: topicsError } = await supabase
        .from("committee_meeting_topics")
        .insert(
          topics.map((t) => ({
            meeting_id: insertedMeeting.id,
            topic_order: t.order,
            title: t.title,
            speakers: t.speakerLabels.map((label) => ({ label })),
            start_voice_no: t.startVoiceNo,
            end_voice_no: t.endVoiceNo,
          }))
        );
      if (topicsError) {
        throw new Error(`議題の投入に失敗 (${file}): ${topicsError.message}`);
      }
      topicCount += topics.length;
    }

    inserted++;
    console.log(`投入: ${file}（議題${topics.length}件）`);
  }

  console.log(
    `完了: 会議${inserted}件（議題${topicCount}件）投入 / スキップ（登録済み）${skipped}件`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
