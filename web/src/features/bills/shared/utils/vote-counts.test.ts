import { describe, expect, it } from "vitest";
import { isUnanimousVote } from "./vote-counts";

describe("isUnanimousVote", () => {
  it("賛成のみなら全会一致", () => {
    expect(isUnanimousVote({ for: 16, against: 0 })).toBe(true);
  });

  it("反対のみなら全会一致", () => {
    expect(isUnanimousVote({ for: 0, against: 16 })).toBe(true);
  });

  it("賛否が割れていれば全会一致ではない", () => {
    expect(isUnanimousVote({ for: 9, against: 5 })).toBe(false);
  });

  it("賛成・反対とも0人なら全会一致ではない", () => {
    expect(isUnanimousVote({ for: 0, against: 0 })).toBe(false);
  });
});
