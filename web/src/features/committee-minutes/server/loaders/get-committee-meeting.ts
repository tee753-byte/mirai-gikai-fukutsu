import "server-only";
import type { CommitteeMeetingDetail } from "../../shared/types";
import { findMeetingByDocumentId } from "../repositories/committee-meeting-repository";

/** 会議録検索システムのDocumentIDで会議詳細（発言つき）を取得する */
export async function getCommitteeMeeting(
  documentId: number
): Promise<CommitteeMeetingDetail | null> {
  try {
    return await findMeetingByDocumentId(documentId);
  } catch (e) {
    console.error("委員会会議の取得に失敗しました", e);
    return null;
  }
}
