import "server-only";
import type {
  CommitteeArchive,
  CommitteeMeetingSummary,
} from "../../shared/types";
import {
  buildArchives,
  findAllMeetings,
} from "../repositories/committee-meeting-repository";

/**
 * 委員会一覧と全会議を取得する。
 * テーブル未作成の環境（マイグレーション適用前の本番等）でもページが
 * 落ちないよう、取得失敗時は空で返す。
 */
export async function getCommitteeArchives(): Promise<{
  archives: CommitteeArchive[];
  meetings: CommitteeMeetingSummary[];
}> {
  try {
    const meetings = await findAllMeetings();
    return { archives: buildArchives(meetings), meetings };
  } catch (e) {
    console.error("委員会一覧の取得に失敗しました", e);
    return { archives: [], meetings: [] };
  }
}
