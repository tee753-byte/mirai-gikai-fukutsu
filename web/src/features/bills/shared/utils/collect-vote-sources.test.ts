import { describe, expect, it } from "vitest";
import { collectVoteSources } from "./collect-vote-sources";

describe("collectVoteSources", () => {
  it("同じ出典が並ぶ場合は1つにまとめる", () => {
    const result = collectVoteSources([
      { source_note: "令和8年3月24日の録画配信で確認" },
      { source_note: "令和8年3月24日の録画配信で確認" },
    ]);
    expect(result).toEqual(["令和8年3月24日の録画配信で確認"]);
  });

  it("異なる出典が混在する場合は全て残す", () => {
    const result = collectVoteSources([
      { source_note: "令和8年3月24日の録画配信で確認" },
      { source_note: "令和8年3月26日の録画配信で確認" },
    ]);
    expect(result).toEqual([
      "令和8年3月24日の録画配信で確認",
      "令和8年3月26日の録画配信で確認",
    ]);
  });

  it("nullや空文字の出典は除外する", () => {
    const result = collectVoteSources([
      { source_note: "" },
      { source_note: null },
      { source_note: "令和8年3月24日の録画配信で確認" },
    ]);
    expect(result).toEqual(["令和8年3月24日の録画配信で確認"]);
  });
});
