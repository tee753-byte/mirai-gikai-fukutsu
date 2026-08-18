import { Container } from "@/components/layouts/container";
import { COUNCIL_TERM_LABEL } from "@/features/council-members/shared/member-profiles";
import {
  AttendanceMatrixSection,
  AttendanceMatrixTable,
} from "@/features/general-questions/server/components/attendance-matrix-table";
import { getAttendanceMatrix } from "@/features/general-questions/server/loaders/get-attendance-matrix";
import { COLOR_VARIANTS } from "./color-variants";
import { MOCK_MATRIX } from "./mock-matrix";

export const metadata = {
  title: "【プロトタイプ】定例会ごとの登壇状況",
};

/**
 * 定例会ごとの登壇状況（星取表）の見え方を確認する開発用ページ。
 *
 * 本番の置き場所は議員一覧ページ（/questions/members）の上部で、
 * そちらは折りたたんだ状態で置いている。ここでは開いた状態と
 * 折りたたんだ状態の両方を並べて、どちらの見え方も確認できるようにする。
 */
export default async function AttendanceMatrixPrototypePage() {
  const { matrix } = await getAttendanceMatrix();

  return (
    <Container className="py-8 max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-bold text-mirai-text-muted">
          プロトタイプ（開発用ページ）
        </p>
        <h1 className="mt-1 text-2xl font-bold text-mirai-text">
          定例会ごとの登壇状況
        </h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          今の任期（{COUNCIL_TERM_LABEL}
          ）に開かれた定例会のうち、一般質問を掲載している
          {matrix.sessions.length}回（{matrix.sessions[0]?.fullName}〜
          {matrix.sessions[matrix.sessions.length - 1]?.fullName}
          ）を並べています。掲載していない定例会は列に出していません。
        </p>
      </div>

      <h2 className="mb-2 text-sm font-bold text-mirai-text-secondary">
        ① 議員一覧ページに置く形（折りたたみ・既定は閉じた状態）
      </h2>
      <AttendanceMatrixSection matrix={matrix} />

      <h2 className="mt-8 mb-2 text-sm font-bold text-mirai-text-secondary">
        ② 開いた状態の中身
      </h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <AttendanceMatrixTable matrix={matrix} />
      </div>

      <h2 className="mt-10 mb-2 text-sm font-bold text-mirai-text-secondary">
        ③ 任期いっぱい（16回）まで増えたときの横幅【見本】
      </h2>
      <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
        <p className="text-xs leading-relaxed text-mirai-text-secondary">
          <strong className="font-bold text-mirai-text">
            ここは幅を確かめるための見本で、実データではありません。
          </strong>
          氏名も登壇状況もすべて架空のものです（実在の議員に事実でない記録を
          結び付けないため）。令和5年3月定例会からの取り込みが終わると、
          この横幅になります。議長のマス（×）と、任期途中で退任した場合のマス
          （在任期間外）も含めています。
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <AttendanceMatrixTable matrix={MOCK_MATRIX} />
      </div>

      <h2 className="mt-10 mb-2 text-sm font-bold text-mirai-text-secondary">
        ④ 配色パターンの比較（検討の記録）
      </h2>
      <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
        <p className="text-xs leading-relaxed text-mirai-text-secondary">
          <strong className="font-bold text-mirai-text">
            C（登壇の有無を最優先版）を本採用にした。
          </strong>
          ①〜③はすでにCの配色で表示している。ここでは検討した他の案も
          並べて、なぜCになったかを後から追えるようにしている。
          「登壇なし」「議長のため行わない」の文字色は、実測でコントラストが
          基準（WCAG）を下回っていたため、どのパターンも共通で直している。
        </p>
      </div>
      {COLOR_VARIANTS.map(({ key, title, style }) => (
        <div key={key} className="mb-6">
          <h3 className="mb-2 text-xs font-bold text-mirai-text-secondary">
            {title}
          </h3>
          <div className="rounded-xl border border-border bg-card p-4">
            <AttendanceMatrixTable
              matrix={MOCK_MATRIX}
              cellStyle={style}
              hideNotes
            />
          </div>
        </div>
      ))}
    </Container>
  );
}
