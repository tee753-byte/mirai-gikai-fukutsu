import { describe, expect, it } from "vitest";
import { sortBillsByNumber } from "./sort-bills-by-number";

const nums = (list: string[]) =>
  sortBillsByNumber(list.map((bill_number) => ({ bill_number }))).map(
    (b) => b.bill_number
  );

describe("sortBillsByNumber", () => {
  it("種別 → 番号の順に並べる（令和8年9月定例会の実際の並びで確認）", () => {
    expect(
      nums([
        "発議第7号",
        "議案第54号",
        "同意第15号",
        "議案第53号",
        "認定第1号",
        "請願第1号",
        "同意第14号",
        "議案第62号",
      ])
    ).toEqual([
      "議案第53号",
      "議案第54号",
      "議案第62号",
      "認定第1号",
      "同意第14号",
      "同意第15号",
      "発議第7号",
      "請願第1号",
    ]);
  });

  it("番号は数として比べる（第9号は第10号より前）", () => {
    expect(nums(["議案第10号", "議案第9号"])).toEqual([
      "議案第9号",
      "議案第10号",
    ]);
  });

  it("形の違う番号は最後に回す", () => {
    expect(nums(["その他", "議案第1号"])).toEqual(["議案第1号", "その他"]);
  });
});
