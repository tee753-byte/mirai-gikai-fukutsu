import "server-only";
import {
  type AttendanceMatrix,
  buildAttendanceMatrix,
  isSessionInCurrentTerm,
  toAttendanceSession,
} from "../../shared/utils/build-attendance-matrix";
import { getQuestionerGroups } from "./get-questioner-groups";
import { getSessionsWithQuestions } from "./get-sessions-with-questions";

export type AttendanceMatrixResult = {
  matrix: AttendanceMatrix;
};

/**
 * 定例会ごとの登壇状況（星取表）を組み立てる。
 *
 * 並べるのは「今の任期に開かれた定例会のうち、当サイトが一般質問を掲載しているもの」。
 * 掲載していない定例会は列そのものを出さない。空の列として並べると、
 * 開催されたのに誰も登壇しなかったように見えてしまうため。
 */
export async function getAttendanceMatrix(): Promise<AttendanceMatrixResult> {
  const [questioners, allSessions] = await Promise.all([
    getQuestionerGroups(),
    getSessionsWithQuestions(),
  ]);

  // getSessionsWithQuestions は新しい順に返すので、表示に合わせて古い順に直す
  const sessions = allSessions
    .map((s) => ({ slug: s.slug, name: s.name, startDate: s.startDate }))
    .filter(isSessionInCurrentTerm)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
    .map(toAttendanceSession);

  return { matrix: buildAttendanceMatrix(questioners, sessions) };
}
