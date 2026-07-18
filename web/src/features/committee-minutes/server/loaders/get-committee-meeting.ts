import "server-only";
import type { CommitteeMeetingDetail } from "../../shared/types";
import { findMeetingByDocumentId } from "../repositories/committee-meeting-repository";

/** 会議録検索システムのDocumentIDで会議詳細（発言つき）を取得する */
export async function getCommitteeMeeting(
  documentId: number
): Promise<CommitteeMeetingDetail | null> {
  return findMeetingByDocumentId(documentId);
}
