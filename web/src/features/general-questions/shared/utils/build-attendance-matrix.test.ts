import { describe, expect, it, vi } from "vitest";

// 名簿は実データなので、テストの意図が名簿の変更に左右されないよう差し替える。
// 「議長」「任期途中で退任した議員」の扱いを、実際の顔ぶれと切り離して確かめる。
vi.mock("@/features/council-members/shared/member-profiles", () => ({
  COUNCIL_TERM_START_DATE: "2023-01-24",
  COUNCIL_MEMBER_PROFILES: [
    { slug: "議長太郎", name: "議長 太郎", role: "議長" },
    { slug: "山田花子", name: "山田 花子", role: null },
    { slug: "退任次郎", name: "退任 次郎", role: null },
  ],
  FORMER_COUNCIL_MEMBERS: [
    {
      slug: "退任次郎",
      name: "退任 次郎",
      leftOn: "2023-10-31",
      leftOnLabel: "令和5年10月",
    },
  ],
}));

const {
  buildAttendanceMatrix,
  collectUsedCellTypes,
  countAppearances,
  countEligibleSessions,
  groupSessionsByYear,
  isSessionInCurrentTerm,
  splitSessionLabel,
  toAttendanceSession,
  toShortLeftOnLabel,
} = await import("./build-attendance-matrix");

type Questioner = Parameters<typeof buildAttendanceMatrix>[0][number];

function makeQuestioner(
  slug: string,
  sessionSlugs: { sessionSlug: string; questionType?: string }[]
): Questioner {
  return {
    slug,
    name: slug,
    party: "会派A",
    entries: sessionSlugs.map((s, i) => ({
      questionId: `q-${i}`,
      sessionName: s.sessionSlug,
      sessionSlug: s.sessionSlug,
      sessionStartDate: null,
      questionType: (s.questionType ??
        "general") as Questioner["entries"][number]["questionType"],
      summary: null,
      updatedAt: "2026-01-01T00:00:00Z",
      topicTitles: [],
      hasTranscript: true,
    })),
  };
}

const SESSIONS = [
  { slug: "r5-3", name: "令和5年 3月定例会", startDate: "2023-02-28" },
  { slug: "r5-6", name: "令和5年 6月定例会", startDate: "2023-06-05" },
  { slug: "r5-12", name: "令和5年 12月定例会", startDate: "2023-11-27" },
  { slug: "r6-3", name: "令和6年 3月定例会", startDate: "2024-02-26" },
].map(toAttendanceSession);

describe("splitSessionLabel", () => {
  it("定例会名を年と月に分ける", () => {
    expect(splitSessionLabel("令和7年 9月定例会")).toEqual({
      yearLabel: "令和7年",
      monthLabel: "9月",
    });
  });

  it("年と月の間に空白が無くても分けられる", () => {
    expect(splitSessionLabel("令和8年3月定例会")).toEqual({
      yearLabel: "令和8年",
      monthLabel: "3月",
    });
  });

  it("想定外の表記でも列を出せるよう、月の位置にそのまま入れる", () => {
    expect(splitSessionLabel("臨時の会")).toEqual({
      yearLabel: "",
      monthLabel: "臨時の会",
    });
  });
});

describe("isSessionInCurrentTerm", () => {
  it("今の任期に開かれた定例会は対象にする", () => {
    expect(
      isSessionInCurrentTerm({
        name: "令和5年 3月定例会",
        startDate: "2023-02-28",
      })
    ).toBe(true);
  });

  it("前の任期の定例会は対象にしない", () => {
    expect(
      isSessionInCurrentTerm({
        name: "令和4年 12月定例会",
        startDate: "2022-11-28",
      })
    ).toBe(false);
  });

  it("臨時会は一般質問を行わないため対象にしない", () => {
    expect(
      isSessionInCurrentTerm({
        name: "令和8年 1月臨時会",
        startDate: "2026-01-13",
      })
    ).toBe(false);
  });

  it("開始日が分からないものは、任期内か判断できないため対象にしない", () => {
    expect(
      isSessionInCurrentTerm({ name: "令和8年 6月定例会", startDate: null })
    ).toBe(false);
  });
});

describe("groupSessionsByYear", () => {
  it("連続する同じ年の列をまとめる", () => {
    expect(groupSessionsByYear(SESSIONS)).toEqual([
      { yearLabel: "令和5年", sessionCount: 3 },
      { yearLabel: "令和6年", sessionCount: 1 },
    ]);
  });

  it("列が無いときは空になる", () => {
    expect(groupSessionsByYear([])).toEqual([]);
  });
});

describe("buildAttendanceMatrix", () => {
  it("一般質問と総括質疑を区別する", () => {
    const matrix = buildAttendanceMatrix(
      [
        makeQuestioner("山田花子", [
          { sessionSlug: "r5-3", questionType: "sokatsu_shitsugi" },
          { sessionSlug: "r5-6" },
        ]),
      ],
      SESSIONS
    );

    expect(matrix.rows[0].cells).toEqual([
      "sokatsu",
      "general",
      "none",
      "none",
    ]);
  });

  it("議長は、登壇していない定例会を「登壇なし」と区別する", () => {
    const matrix = buildAttendanceMatrix(
      [makeQuestioner("議長太郎", [])],
      SESSIONS
    );

    expect(matrix.rows[0].isChair).toBe(true);
    expect(matrix.rows[0].cells).toEqual(["chair", "chair", "chair", "chair"]);
  });

  it("任期途中で退任した議員は、退任後の定例会を「登壇なし」にしない", () => {
    const matrix = buildAttendanceMatrix(
      [makeQuestioner("退任次郎", [{ sessionSlug: "r5-3" }])],
      SESSIONS
    );

    // 2023-10-31 に退任。r5-6(6月)までは在任、r5-12(11月)以降は在任期間外
    expect(matrix.rows[0].cells).toEqual([
      "general",
      "none",
      "not_in_office",
      "not_in_office",
    ]);
    expect(matrix.rows[0].leftOnLabel).toBe("令和5年10月");
  });

  it("退任した議員の分母には、在任していなかった定例会を含めない", () => {
    const matrix = buildAttendanceMatrix(
      [makeQuestioner("退任次郎", [{ sessionSlug: "r5-3" }])],
      SESSIONS
    );

    expect(countAppearances(matrix.rows[0])).toBe(1);
    expect(countEligibleSessions(matrix.rows[0])).toBe(2);
  });

  it("在任中の議員の分母は、並べたすべての定例会になる", () => {
    const matrix = buildAttendanceMatrix(
      [makeQuestioner("山田花子", [{ sessionSlug: "r5-3" }])],
      SESSIONS
    );

    expect(countEligibleSessions(matrix.rows[0])).toBe(SESSIONS.length);
  });
});

describe("collectUsedCellTypes", () => {
  it("表に出ていない状態は凡例に出さないよう、使われた状態だけを返す", () => {
    const matrix = buildAttendanceMatrix(
      [makeQuestioner("山田花子", [{ sessionSlug: "r5-3" }])],
      SESSIONS
    );

    expect([...collectUsedCellTypes(matrix)].sort()).toEqual([
      "general",
      "none",
    ]);
  });
});

describe("toShortLeftOnLabel", () => {
  it("氏名の欄を狭く保てるよう、退任時期を短くする", () => {
    expect(toShortLeftOnLabel("令和6年6月")).toBe("R6.6");
    expect(toShortLeftOnLabel("令和10年12月")).toBe("R10.12");
  });

  it("想定外の表記は、意味が失われないようそのまま返す", () => {
    expect(toShortLeftOnLabel("令和6年6月末")).toBe("令和6年6月末");
  });
});
