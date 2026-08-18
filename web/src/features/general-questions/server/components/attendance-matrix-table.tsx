import "server-only";
import { ChevronDown, Info } from "lucide-react";
import Link from "next/link";
import { COUNCIL_TERM_LABEL } from "@/features/council-members/shared/member-profiles";
import {
  type AttendanceCell,
  type AttendanceMatrix,
  collectUsedCellTypes,
  countAppearances,
  countEligibleSessions,
  groupSessionsByYear,
  toShortLeftOnLabel,
} from "../../shared/utils/build-attendance-matrix";
import { groupQuestionersByParty } from "../../shared/utils/group-questioners-by-party";

type Props = {
  matrix: AttendanceMatrix;
  /**
   * 折りたたんだ状態で置くか。既定は閉じておく。
   * 議員一覧の本体（1人ずつのカード）より先に大きな表が出ると、
   * 目当ての議員を探しに来た人の邪魔になるため。
   */
  defaultOpen?: boolean;
};

/**
 * 折りたたみ見出し付きで星取表を置く。
 *
 * 開閉に <details> を使うのは、JavaScriptなしで動きサーバーコンポーネントの
 * ままにできるため。検索エンジンやスクリーンリーダーからも中身が読める。
 */
export function AttendanceMatrixSection({
  matrix,
  defaultOpen = false,
}: Props) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-border bg-card"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-mirai-surface-muted [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="text-sm font-bold text-mirai-text">
            定例会ごとの登壇状況
          </h2>
          <p className="mt-0.5 text-xs text-mirai-text-secondary">
            今の任期の定例会{matrix.sessions.length}
            回について、各議員が一般質問・総括質疑に登壇したか
          </p>
        </div>
        {/*
          ▼印だけだと押せる場所だと気づかれないため、「開く」「閉じる」と
          文字でも出す。<details> の開閉状態でどちらを見せるかを切り替えており、
          JavaScriptは使っていない。
        */}
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
          <span className="group-open:hidden">開く</span>
          <span className="hidden group-open:inline">閉じる</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </span>
      </summary>

      <div className="border-t border-border px-4 py-4">
        <AttendanceMatrixTable matrix={matrix} />
      </div>
    </details>
  );
}

/** マスの見た目。色だけで区別せず、記号と読み上げ文も添える（色覚特性への配慮） */
export type CellStyle = { mark: string; label: string; className: string };
export type CellStyleMap = Record<AttendanceCell, CellStyle>;

/**
 * 既定の配色。
 *
 * 「登壇なし」「議長のため行わない」は、実測すると文字と背景のコントラストが
 * 2.6〜2.9:1しかなく、WCAGの基準（図形として最低3:1、文字なら4.5:1）を
 * 満たしていなかった。目立たせすぎない配慮のつもりが、単純に読み取りにくい
 * だけになっていたための修正で、この文字色（text-mirai-text-secondary）は
 * どの配色パターンでも共通で使う。
 *
 * 一般質問・総括質疑はどちらも赤系の塗りにまとめている。「登壇したか」を
 * まず目に入らせることを優先し、内訳（一般質問か総括質疑か）はマークの形と
 * 凡例で区別する。色相はサイト全体の単色アクセント（臙脂）を保つため増やさない。
 */
export const DEFAULT_CELL_STYLE: CellStyleMap = {
  general: {
    mark: "●",
    label: "一般質問",
    className: "bg-primary text-white",
  },
  sokatsu: {
    mark: "◆",
    label: "総括質疑",
    className: "bg-primary/70 font-bold text-white",
  },
  none: {
    mark: "－",
    label: "登壇なし",
    className:
      "border border-mirai-text-placeholder bg-card text-mirai-text-secondary",
  },
  chair: {
    mark: "×",
    label: "議長のため行わない",
    className: "bg-mirai-surface-muted text-mirai-text-secondary",
  },
  not_in_office: {
    // 記号を置かないのは、空白のほうが「この期間は対象外」と読めるため。
    // 読み上げ用の文字は別に持たせているので、意味は失われない。
    mark: "",
    label: "在任期間外",
    className: "border border-dashed border-border bg-transparent",
  },
};

/**
 * この列数から、スマートフォンの画面幅では表が収まらなくなる目安。
 *
 * 実測（画面幅360pxの端末。国内でよくある幅の下限）では、枠の見えている幅が
 * 262px、氏名の欄が85px・集計欄が43pxを占めるため、マスに使える幅は134px。
 * 1マス26pxなので、5列目からはみ出す計算になる。
 * 収まっているのに案内を出したり表示位置を動かしたりすると、かえって
 * 分かりにくいので、4列までは何もせず、5列目からだけ手を加える。
 */
const HORIZONTAL_SCROLL_MIN_COLUMNS = 5;

/** 凡例に並べる順。実際に表で使われている状態だけを出す */
const CELL_ORDER: AttendanceCell[] = [
  "general",
  "sokatsu",
  "none",
  "chair",
  "not_in_office",
];

/**
 * 定例会ごとの登壇状況を並べた星取表。
 *
 * 並び順は議員一覧と同じ会派ごとの固定順にしている。登壇回数で並べ替えると
 * 事実の一覧ではなくランキングになるため、回数ではソートしない。
 *
 * 見出しは「年」と「月」の2段にしている。1列に「令和7年 9月」と入れると
 * 任期4年ぶん（最大16回）を並べたときに横幅が膨らむため。
 */
export function AttendanceMatrixTable({
  matrix,
  cellStyle = DEFAULT_CELL_STYLE,
  /**
   * 読み方の注記（NeutralityNote・スクロール案内・出典の注記）を省く。
   * 配色パターンを並べて見比べる開発用ページで、同じ文章を何度も
   * 繰り返さないようにするためだけの指定で、本番のページでは使わない。
   */
  hideNotes = false,
}: {
  matrix: AttendanceMatrix;
  cellStyle?: CellStyleMap;
  hideNotes?: boolean;
}) {
  // 議員一覧と同じ並び（無所属→会派は人数順→会派内は氏名順）
  const partyGroups = groupQuestionersByParty(
    matrix.rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      party: r.party === "会派情報なし" ? null : r.party,
      entries: [],
    }))
  );
  const rowBySlug = new Map(matrix.rows.map((r) => [r.slug, r]));
  const yearGroups = groupSessionsByYear(matrix.sessions);
  const usedCellTypes = collectUsedCellTypes(matrix);

  return (
    <div>
      {!hideNotes && <NeutralityNote />}

      {!hideNotes &&
        matrix.sessions.length >= HORIZONTAL_SCROLL_MIN_COLUMNS && (
          <p className="mt-3 text-xs leading-relaxed text-mirai-text-muted sm:hidden">
            表は<strong className="font-bold">直近の定例会</strong>
            から表示しています。
            横にスクロールすると、さかのぼって見られます（議員名と登壇の回数は左右に固定しています）。
          </p>
        )}

      {/*
        列が多いときは、枠を rtl にして最初に見える位置を右端（最新の定例会）にする。
        古い順に左から並べているため、そのままだと任期の初め（令和5年）が出て、
        スマートフォンでは最新の回まで何画面もスクロールすることになる。
        表そのものは ltr のままなので、並び順や文字の向きは変わらない。
        収まっている場合はスクロールが起きず、右寄せの副作用だけが出るため適用しない。
      */}
      <div
        className={`mt-3 overflow-x-auto ${
          matrix.sessions.length >= HORIZONTAL_SCROLL_MIN_COLUMNS
            ? "[direction:rtl] [&>table]:[direction:ltr]"
            : ""
        }`}
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-10 bg-card px-2 py-2 text-left text-xs font-bold text-mirai-text-secondary"
              >
                議員
              </th>
              {yearGroups.map((group) => (
                <th
                  key={group.yearLabel}
                  colSpan={group.sessionCount}
                  scope="colgroup"
                  className="whitespace-nowrap border-b border-border px-1 pb-1 text-center text-[11px] font-bold text-mirai-text-secondary"
                >
                  {group.yearLabel}
                </th>
              ))}
              <th
                rowSpan={2}
                className="sticky right-0 z-10 bg-card px-1.5 py-2 text-center text-xs font-bold text-mirai-text-secondary"
              >
                登壇
              </th>
            </tr>
            <tr>
              {matrix.sessions.map((s) => (
                <th
                  key={s.slug}
                  scope="col"
                  className="whitespace-nowrap px-1 pt-1 pb-2 text-center text-[11px] font-bold text-mirai-text-secondary"
                >
                  {s.monthLabel}
                </th>
              ))}
            </tr>
          </thead>

          {partyGroups.map((group) => (
            <tbody key={group.partyLabel}>
              <tr>
                {/*
                  セル自体を sticky にしても効かない。表の全幅ぶんの大きさがあり
                  動く余地が無いため、横にスクロールすると中の文字だけが流れて消える。
                  文字を包む span を固定して、どの会派の行を見ているか分かるようにする。
                */}
                <th
                  colSpan={matrix.sessions.length + 2}
                  scope="colgroup"
                  className="bg-mirai-surface-grouped py-1 text-left text-xs font-bold text-mirai-text-secondary"
                >
                  <span className="sticky left-0 inline-block px-2">
                    {group.partyLabel}
                  </span>
                </th>
              </tr>
              {group.members.map((m) => {
                const row = rowBySlug.get(m.slug);
                if (!row) return null;
                const count = countAppearances(row);
                const eligible = countEligibleSessions(row);

                return (
                  <tr key={row.slug} className="border-b border-border">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 whitespace-nowrap bg-card px-1.5 py-2 text-left font-normal"
                    >
                      <Link
                        href={`/questions/members/${encodeURIComponent(row.slug)}`}
                        className="text-mirai-text hover:underline"
                      >
                        {row.name}
                      </Link>
                      {/*
                        （議長）〜R6.6 は氏名の隣ではなく下の行に置く。
                        同じ行に並べると、この2件のためだけに氏名列の幅が
                        全行ぶん広がり、スマートフォンで見えるマス数が減るため。
                      */}
                      {(row.isChair || row.leftOnLabel) && (
                        <span className="block text-[10px] leading-tight text-mirai-text-muted">
                          {row.isChair && "（議長）"}
                          {row.leftOnLabel && (
                            <span title={`${row.leftOnLabel}まで在任`}>
                              <span aria-hidden="true">
                                〜{toShortLeftOnLabel(row.leftOnLabel)}
                              </span>
                              {/* 「R6.6」は読み上げても伝わらないため、元の表記も持たせる */}
                              <span className="sr-only">
                                {row.leftOnLabel}まで在任
                              </span>
                            </span>
                          )}
                        </span>
                      )}
                    </th>

                    {row.cells.map((cell, i) => {
                      const style = cellStyle[cell];
                      const session = matrix.sessions[i];
                      return (
                        <td
                          key={session.slug}
                          className="px-px py-1.5 text-center"
                        >
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] ${style.className}`}
                            title={`${session.fullName}：${style.label}`}
                          >
                            <span aria-hidden="true">{style.mark}</span>
                            {/* 記号だけでは読み上げられないため、意味を文字でも持たせる */}
                            <span className="sr-only">{style.label}</span>
                          </span>
                        </td>
                      );
                    })}

                    <td className="sticky right-0 whitespace-nowrap bg-card px-1.5 py-1.5 text-center text-xs tabular-nums text-mirai-text-secondary">
                      {row.isChair ? "—" : `${count}/${eligible}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>

      <Legend usedCellTypes={usedCellTypes} cellStyle={cellStyle} />

      {!hideNotes && (
        <p className="mt-3 text-xs leading-relaxed text-mirai-text-muted">
          今の任期（{COUNCIL_TERM_LABEL}）に開かれた定例会のうち、
          当サイトが一般質問を掲載しているものを古い順に並べています。
          まだ掲載していない定例会は列に出していません（順次追加しています）。
          臨時会は一般質問を行わないため含めていません。
        </p>
      )}
    </div>
  );
}

function Legend({
  usedCellTypes,
  cellStyle,
}: {
  usedCellTypes: Set<AttendanceCell>;
  cellStyle: CellStyleMap;
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {CELL_ORDER.filter((key) => usedCellTypes.has(key)).map((key) => {
        const style = cellStyle[key];
        return (
          <li key={key} className="flex items-center gap-1.5">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] ${style.className}`}
              aria-hidden="true"
            >
              {style.mark}
            </span>
            <span className="text-xs text-mirai-text-secondary">
              {style.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 表の読み方の注記。
 *
 * 登壇の有無だけを並べると「回数が多いほど良い」という評価に読まれかねない。
 * 一般質問が義務ではないこと、登壇しなかった理由が会議録に残らないことを
 * 表より先に置き、読み手が事実の範囲を誤らないようにする。
 */
function NeutralityNote() {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-mirai-text-secondary">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          一般質問は、議員が市政について市長や担当部長に直接尋ねる場です。
          <strong className="font-bold text-mirai-text">
            行うかどうかは各議員の判断で、義務ではありません。
          </strong>
          登壇しなかった理由は会議録に記録されないため、この表からは分かりません。
          回数の多い少ないだけで活動の量や質を判断できるものではない点にご注意ください。
          なお、議長は会議の進行役を務めるため、慣例として一般質問を行いません。
          会派は現在のもので分けており、任期の途中で変わっている場合があります。
        </span>
      </p>
    </div>
  );
}
