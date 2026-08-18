import { describe, expect, it } from "vitest";
import {
  buildVoteGrid,
  parseBBoxWords,
  parseGikaidayoriVotes,
} from "./parse-gikaidayori-votes";

/** pdftotext -bbox-layout の出力を1語ぶん作る */
function word(x: number, y: number, text: string, height = 10): string {
  return `<word xMin="${x}" yMin="${y}" xMax="${x + 7}" yMax="${y + height}">${text}</word>`;
}

/**
 * 議会だより82号 6-7ページの賛否表を、3人×2件に縮めたもの。
 * 実物は16人×10件で、列の間隔は11.6pt、行の間隔は12.7〜21.6pt。
 * 議長の列だけ記号が無く、名前だけが並ぶ。
 */
const COLUMN_X = [100, 111.6, 123.2];
const CHAIR_X = 134.8;

const SAMPLE = [
  "<html><body><doc><page>",
  // 議員名（姓と名で2段）。記号より少し右に置かれる
  ...COLUMN_X.map((x, i) => word(x + 3.5, 41, ["大山", "中村", "山本"][i], 14)),
  ...COLUMN_X.map((x, i) => word(x + 3.5, 62, ["隆之", "恵輔", "祐平"][i], 14)),
  word(CHAIR_X + 3.5, 41, "髙山", 14),
  word(CHAIR_X + 3.5, 62, "賢二", 14),
  // 1行目（1行に収まる案件名）
  word(10, 107, "同意", 10),
  word(30, 107, "教育委員会委員の任命への同意", 10),
  ...COLUMN_X.map((x, i) => word(x, 107, ["○", "○", "●"][i], 10)),
  // 2行目（2行に折り返す案件名。記号の行の上下にはみ出す）
  word(10, 124, "否決", 10),
  word(30, 119, "基金運用における債券の含み損問題に関する調査のため", 10),
  word(30, 128, "特別委員会を設置する決議の提出", 10),
  ...COLUMN_X.map((x, i) => word(x, 124, ["●", "●", "○"][i], 10)),
  "</page></doc></body></html>",
].join("\n");

describe("parseBBoxWords", () => {
  it("pdftotext -bbox-layout の <word> を座標つきで拾う", () => {
    const words = parseBBoxWords(SAMPLE);

    expect(words).toHaveLength(19);
    expect(words[0]).toMatchObject({ x0: 103.5, y0: 41, text: "大山" });
  });
});

describe("buildVoteGrid", () => {
  it("○●を議員の列と案件の行に組み立て直す", () => {
    const grid = buildVoteGrid(parseBBoxWords(SAMPLE));

    expect(grid.columnX).toHaveLength(3);
    expect(grid.rowY).toHaveLength(2);
    expect(grid.marks).toEqual([
      ["賛成", "賛成", "反対"],
      ["反対", "反対", "賛成"],
    ]);
  });
});

describe("parseGikaidayoriVotes", () => {
  const rows = parseGikaidayoriVotes(SAMPLE, "6月定例会");

  it("案件ごとに議決結果と議員別の賛否を返す", () => {
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      session: "6月定例会",
      result: "同意",
      title: "教育委員会委員の任命への同意",
      votes: {
        大山隆之: "賛成",
        中村恵輔: "賛成",
        山本祐平: "反対",
        髙山賢二: null,
      },
    });
  });

  it("2行に折り返した案件名もつなげて読む", () => {
    expect(rows[1].title).toBe(
      "基金運用における債券の含み損問題に関する調査のため特別委員会を設置する決議の提出"
    );
    expect(rows[1].result).toBe("否決");
  });

  it("記号が無い議長の列も、名前だけ拾って不参加として扱う", () => {
    // 議長は表決に参加しないため、賛否ではなく null になる
    expect(rows[1].votes.髙山賢二).toBeNull();
  });

  it("賛否表が無いPDF（スキャン画像の号）では空を返す", () => {
    expect(parseGikaidayoriVotes("<html><body></body></html>", "6月定例会"))
      .toEqual([]);
  });
});
