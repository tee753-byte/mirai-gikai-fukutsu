import { describe, expect, it } from "vitest";
import { getCommitteeTypeLabel } from "./committee-type";

describe("getCommitteeTypeLabel", () => {
  it("スラッグから委員会種別を返す", () => {
    expect(getCommitteeTypeLabel("bunkyo")).toBe("常任委員会");
    expect(getCommitteeTypeLabel("kuko-kotsu-infra")).toBe("特別委員会");
    expect(getCommitteeTypeLabel("yosan")).toBe("予算・決算");
    expect(getCommitteeTypeLabel("gikai-unei")).toBe("議会運営委員会");
  });

  it("未知のスラッグは常任委員会にフォールバックする", () => {
    expect(getCommitteeTypeLabel("unknown-slug")).toBe("常任委員会");
  });
});
