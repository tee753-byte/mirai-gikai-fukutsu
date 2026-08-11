import { describe, expect, it } from "vitest";
import {
  buildQuestionerGroups,
  type GeneralQuestionWithSession,
  toQuestionerSlug,
} from "./build-questioner-groups";

function makeQuestion(
  overrides: Partial<GeneralQuestionWithSession>
): GeneralQuestionWithSession {
  return {
    id: "q-1",
    council_session_id: "session-1",
    questioner_name: "山田花子",
    questioner_party: null,
    questioner_number: 1,
    session_day: 1,
    question_order: 1,
    question_type: "general",
    summary: null,
    topics: [],
    raw_text: null,
    source_url: null,
    publish_status: "published",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    session_name: "定例会",
    session_slug: "r8-3",
    session_start_date: "2026-03-01",
    ...overrides,
  };
}

describe("toQuestionerSlug", () => {
  it("半角スペースを除去する", () => {
    expect(toQuestionerSlug("山本 祐平")).toBe("山本祐平");
  });

  it("全角スペースを除去する", () => {
    expect(toQuestionerSlug("山本　祐平")).toBe("山本祐平");
  });
});

describe("buildQuestionerGroups", () => {
  it("入力が時系列順でなくても、最新のsession_start_dateの会派を採用する", () => {
    const questions = [
      // 配列の先頭に「新しい」定例会のレコードを置く（時系列とは逆順）
      makeQuestion({
        id: "q-new",
        questioner_party: "新会派",
        session_start_date: "2026-06-08",
      }),
      makeQuestion({
        id: "q-old",
        questioner_party: "旧会派",
        session_start_date: "2026-03-01",
      }),
    ];

    const groups = buildQuestionerGroups(questions);

    expect(groups).toHaveLength(1);
    expect(groups[0].party).toBe("新会派");
  });

  it("最新レコードの会派がnullの場合は、古いレコードの会派にフォールバックしない", () => {
    const questions = [
      makeQuestion({
        id: "q-old",
        questioner_party: "旧会派",
        session_start_date: "2026-03-01",
      }),
      makeQuestion({
        id: "q-new",
        questioner_party: null,
        session_start_date: "2026-06-08",
      }),
    ];

    const groups = buildQuestionerGroups(questions);

    expect(groups[0].party).toBeNull();
  });

  it("氏名の半角・全角スペースの違いを同一議員として集約する", () => {
    const questions = [
      makeQuestion({ id: "q-1", questioner_name: "山本 祐平" }),
      makeQuestion({ id: "q-2", questioner_name: "山本　祐平" }),
      makeQuestion({ id: "q-3", questioner_name: "山本祐平" }),
    ];

    const groups = buildQuestionerGroups(questions);

    expect(groups).toHaveLength(1);
    expect(groups[0].entries).toHaveLength(3);
  });

  it("session_start_dateがnullのレコードは、既知の日付を上書きしない", () => {
    const questions = [
      makeQuestion({
        id: "q-known",
        questioner_party: "確定会派",
        session_start_date: "2026-03-01",
      }),
      makeQuestion({
        id: "q-unknown",
        questioner_party: "不明会派",
        session_start_date: null,
      }),
    ];

    const groups = buildQuestionerGroups(questions);

    expect(groups[0].party).toBe("確定会派");
  });
});
