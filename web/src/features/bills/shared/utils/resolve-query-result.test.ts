import { describe, expect, it } from "vitest";
import { resolveQueryResult } from "./resolve-query-result";

describe("resolveQueryResult", () => {
  it("正常に0件取得できた場合は空配列を返す", () => {
    const result = resolveQueryResult(
      { data: [], error: null },
      "bill debates"
    );
    expect(result).toEqual([]);
  });

  it("dataがnullでもエラーが無ければ空配列を返す", () => {
    const result = resolveQueryResult(
      { data: null, error: null },
      "bill debates"
    );
    expect(result).toEqual([]);
  });

  it("正常に取得できたデータをそのまま返す", () => {
    const rows = [{ id: "1" }, { id: "2" }];
    const result = resolveQueryResult(
      { data: rows, error: null },
      "bill debates"
    );
    expect(result).toBe(rows);
  });

  it("DBエラー時は空配列にせず例外を投げる", () => {
    expect(() =>
      resolveQueryResult(
        { data: null, error: { message: "connection refused" } },
        "bill debates"
      )
    ).toThrow("Failed to fetch bill debates: connection refused");
  });
});
