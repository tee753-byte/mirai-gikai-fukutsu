import { describe, expect, it } from "vitest";
import type { CouncilSession } from "../types";
import { isSessionOpen } from "./is-session-open";

const session = {
  start_date: "2026-11-20",
  end_date: "2026-12-08",
} as CouncilSession;

describe("isSessionOpen", () => {
  it("開会前は予告扱い（開催済みにしない）", () => {
    expect(isSessionOpen(session, "2026-11-14")).toBe(true);
  });
  it("会期中は開催中", () => {
    expect(isSessionOpen(session, "2026-11-30")).toBe(true);
  });
  it("閉会日当日は開催済み側", () => {
    expect(isSessionOpen(session, "2026-12-08")).toBe(false);
  });
  it("閉会後は開催済み", () => {
    expect(isSessionOpen(session, "2026-12-09")).toBe(false);
  });
});
