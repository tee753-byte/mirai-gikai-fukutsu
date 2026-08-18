import {
  COUNCIL_MEMBER_PROFILES,
  COUNCIL_TERM_START_DATE,
  FORMER_COUNCIL_MEMBERS,
} from "@/features/council-members/shared/member-profiles";
import type { QuestionerGroup } from "./build-questioner-groups";
import { toQuestionerSlug } from "./build-questioner-groups";

/**
 * 定例会ごとに「一般質問（または総括質疑）に登壇したか」を並べた表を組み立てる。
 *
 * 【なぜ作るか】
 * 議員個別のページを1人ずつ開いても、その議員が毎回登壇しているのか、
 * たまたまその回だけ登壇したのかが分からない。定例会を横に並べることで、
 * 市民が「継続して質問しているか」を同じ基準で確認できるようにする。
 *
 * 【対象は今の任期】
 * 並べる範囲は「今の任期に開かれた定例会」に固定する。任期をまたぐと議員の
 * 顔ぶれが変わり、同じ表に並べても比べられないため。任期は4年・定例会は年4回
 * なので、この決め方だと列は最大16回で頭打ちになり、際限なく横に伸びない。
 *
 * 【中立性のために守ること】（PROJECT_PRINCIPLES.md 2章・5章）
 * - 並び順は登壇回数ではなく、議員一覧と同じ固定順（会派ごと）にする。
 *   回数で並べ替えると、事実の提示ではなくランキングになってしまう。
 * - 一般質問は議員の義務ではない。登壇しなかった理由（体調・会派内の分担・
 *   委員会での対応など）は会議録に残らないため、表からは読み取れない。
 *   この点は必ず画面上に注記する。
 * - 議長は会議の進行役のため、慣例として一般質問を行わない。制度上の理由と
 *   個人の選択を混同させないよう、`isChair` で区別できるようにする。
 * - 任期途中で退任した議員の、退任後の定例会は「登壇なし」にしない。
 *   議員でなかった期間を、質問しなかった期間として見せないため。
 * - 臨時会は一般質問を行わないのが通例のため、対象は定例会に限る。
 */

/** 1つのマスの状態 */
export type AttendanceCell =
  /** 一般質問を行った */
  | "general"
  /** 総括質疑を行った（当初予算を審議する定例会などで、一般質問の代わりに行われる） */
  | "sokatsu"
  /** 行っていない */
  | "none"
  /** 議長のため制度上行わない */
  | "chair"
  /** その時点で議員ではない（任期途中の退任後） */
  | "not_in_office";

export type AttendanceRow = {
  slug: string;
  name: string;
  /** 会派。表示のグループ分けに使う */
  party: string;
  /** 議長かどうか。議長は制度上登壇しないため、他の「行っていない」と区別する */
  isChair: boolean;
  /** 任期途中で退任した場合の表記（例: 令和6年12月）。在任中は null */
  leftOnLabel: string | null;
  /** sessions と同じ並び順のマス */
  cells: AttendanceCell[];
};

export type AttendanceSession = {
  slug: string;
  /** 列の見出しに出す月（例: 9月） */
  monthLabel: string;
  /** 列をまとめる年の見出し（例: 令和7年） */
  yearLabel: string;
  /** 正式名称。ツールチップや読み上げに使う */
  fullName: string;
  /** 開始日。議員の在任期間と突き合わせるために持つ */
  startDate: string | null;
};

export type AttendanceMatrix = {
  sessions: AttendanceSession[];
  rows: AttendanceRow[];
};

/**
 * 定例会名を、年と月に分けて列の見出し用にする。
 * 「令和7年 9月定例会」→ 年「令和7年」・月「9月」
 *
 * 見出しを2段（年 → 月）にすると1列あたりの幅が「9月」だけで足り、
 * 任期4年ぶんを並べても横幅が膨らみにくい。
 */
export function splitSessionLabel(name: string): {
  yearLabel: string;
  monthLabel: string;
} {
  const matched = name.match(/^(.+?年)\s*(\d+月)/);
  if (!matched) {
    // 想定外の表記でも列は出せるよう、そのまま月の位置に入れる
    return { yearLabel: "", monthLabel: name.replace(/定例会$/, "").trim() };
  }
  return { yearLabel: matched[1], monthLabel: matched[2] };
}

/** 定例会1件を、表の列の形に直す */
export function toAttendanceSession(session: {
  slug: string;
  name: string;
  startDate: string | null;
}): AttendanceSession {
  const { yearLabel, monthLabel } = splitSessionLabel(session.name);
  return {
    slug: session.slug,
    monthLabel,
    yearLabel,
    fullName: session.name,
    startDate: session.startDate,
  };
}

/**
 * 表に並べる対象の定例会かを判定する。
 *
 * 臨時会は一般質問を行わないのが通例のため会期名で除く。
 * 開始日が分からないものは任期内かを判断できないので、並べない
 * （「開催されたのに登壇しなかった」と誤読される列を作らないため）。
 */
export function isSessionInCurrentTerm(session: {
  name: string;
  startDate: string | null;
}): boolean {
  if (session.name.includes("臨時会")) return false;
  if (!session.startDate) return false;
  return session.startDate >= COUNCIL_TERM_START_DATE;
}

/** 見出しの上段用。連続する同じ年の列をまとめる */
export type AttendanceYearGroup = {
  yearLabel: string;
  /** その年に属する列の数（colSpan に使う） */
  sessionCount: number;
};

/** 列を年ごとにまとめる。sessions は古い順に並んでいる前提 */
export function groupSessionsByYear(
  sessions: AttendanceSession[]
): AttendanceYearGroup[] {
  const groups: AttendanceYearGroup[] = [];
  for (const session of sessions) {
    const last = groups[groups.length - 1];
    if (last && last.yearLabel === session.yearLabel) {
      last.sessionCount += 1;
      continue;
    }
    groups.push({ yearLabel: session.yearLabel, sessionCount: 1 });
  }
  return groups;
}

/**
 * 星取表を組み立てる。
 *
 * @param questioners 全議員（名簿で補完済み。getQuestionerGroups の戻り値）
 * @param sessions 対象の定例会。呼び出し側が古い順に渡す
 */
export function buildAttendanceMatrix(
  questioners: QuestionerGroup[],
  sessions: AttendanceSession[]
): AttendanceMatrix {
  const chairSlugs = new Set(
    COUNCIL_MEMBER_PROFILES.filter((p) => p.role === "議長").map((p) => p.slug)
  );
  const formerBySlug = new Map(FORMER_COUNCIL_MEMBERS.map((m) => [m.slug, m]));

  const rows: AttendanceRow[] = questioners.map((q) => {
    const slug = toQuestionerSlug(q.slug);
    const isChair = chairSlugs.has(slug);
    const former = formerBySlug.get(slug) ?? null;

    const cells = sessions.map((session): AttendanceCell => {
      const entry = q.entries.find((e) => e.sessionSlug === session.slug);
      if (entry) {
        return entry.questionType === "sokatsu_shitsugi"
          ? "sokatsu"
          : "general";
      }
      // 退任した後の定例会は、議員でなかった期間として「登壇なし」と区別する
      if (former && session.startDate && session.startDate > former.leftOn) {
        return "not_in_office";
      }
      return isChair ? "chair" : "none";
    });

    return {
      slug,
      name: q.name,
      party: q.party ?? "会派情報なし",
      isChair,
      leftOnLabel: former?.leftOnLabel ?? null,
      cells,
    };
  });

  return { sessions, rows };
}

/** 登壇した回数（総括質疑を含む）。行の右端に出す */
export function countAppearances(row: AttendanceRow): number {
  return row.cells.filter((c) => c === "general" || c === "sokatsu").length;
}

/**
 * 登壇できた定例会の数。「◯回中◯回」の分母に使う。
 * 在任していなかった定例会を分母に入れると、退任した議員の割合が
 * 実際より低く見えてしまうため除く。
 */
export function countEligibleSessions(row: AttendanceRow): number {
  return row.cells.filter((c) => c !== "not_in_office").length;
}

/** 表の中で実際に使われているマスの状態。凡例を必要なぶんだけ出すために使う */
export function collectUsedCellTypes(
  matrix: AttendanceMatrix
): Set<AttendanceCell> {
  const used = new Set<AttendanceCell>();
  for (const row of matrix.rows) {
    for (const cell of row.cells) used.add(cell);
  }
  return used;
}

/**
 * 退任時期の表記を短くする。「令和6年6月」→「R6.6」
 *
 * 氏名の欄は左端に固定して表示するため、ここが広いとスマートフォンで
 * 見えるマスの数が減る。いつまで在任したかが分かれば足りるので短く出す。
 * 読み上げや吹き出しには元の「令和6年6月」を使い、意味が失われないようにする。
 */
export function toShortLeftOnLabel(label: string): string {
  const matched = label.match(/^令和(\d+)年(\d+)月$/);
  if (!matched) return label;
  return `R${matched[1]}.${matched[2]}`;
}
