import "server-only";
import type { CommitteeMeetingSummary } from "../../shared/types";
import { findMeetingsBySlug } from "../repositories/committee-meeting-repository";

/** 指定した委員会（スラッグ）の会議一覧を開催日降順で取得する */
export async function getCommitteeMeetingsBySlug(
  slug: string
): Promise<CommitteeMeetingSummary[]> {
  return findMeetingsBySlug(slug);
}
