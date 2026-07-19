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
 * テーブル未作成の環境（マイグレーション適用前）ではrepositoryが空を返す。
 * それ以外のDB障害はエラーとして伝播させる。
 */
export async function getCommitteeArchives(): Promise<{
  archives: CommitteeArchive[];
  meetings: CommitteeMeetingSummary[];
}> {
  const meetings = await findAllMeetings();
  return { archives: buildArchives(meetings), meetings };
}
