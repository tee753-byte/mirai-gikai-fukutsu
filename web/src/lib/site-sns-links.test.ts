import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_SNS_LINKS } from "./site-sns-links";

const PUBLIC_DIR = join(__dirname, "../../public");

describe("SITE_SNS_LINKS", () => {
  it("X → Instagram → Threads → Facebook の順で並んでいる", () => {
    expect(SITE_SNS_LINKS.map((link) => link.key)).toEqual([
      "x",
      "instagram",
      "threads",
      "facebook",
    ]);
  });

  it.each(
    SITE_SNS_LINKS
  )("$key: URLがhttpsで始まり、アイコンファイルが実在する", (link) => {
    expect(link.url.startsWith("https://")).toBe(true);
    expect(existsSync(join(PUBLIC_DIR, link.iconPath))).toBe(true);
  });

  it("チームみらい本体のアカウントを指していない", () => {
    for (const link of SITE_SNS_LINKS) {
      expect(link.url).not.toContain("team_mirai");
      expect(link.url).not.toContain("team-mir.ai");
    }
  });
});
