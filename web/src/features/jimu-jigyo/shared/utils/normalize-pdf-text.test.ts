import { describe, expect, it } from "vitest";
import { normalizePdfText } from "./normalize-pdf-text";

describe("normalizePdfText", () => {
  it("文の途中の折り返しは畳む（実データ: 宿泊税導入対策事業）", () => {
    const input =
      "宿泊税を円滑に運用し、公平公正な課税の実現のため適正な賦課徴収に努めることにより、県を挙げた観光振興の\n取組を推し進めるための安定的・継続的財源を確保する。";
    expect(normalizePdfText(input)).toBe(
      "宿泊税を円滑に運用し、公平公正な課税の実現のため適正な賦課徴収に努めることにより、県を挙げた観光振興の取組を推し進めるための安定的・継続的財源を確保する。"
    );
  });

  it("見出し行の改行は残す（実データ: 実績評価と要因）", () => {
    const input =
      "(評価)\n徴収率は99%と目標を概ね達成できた。\n(要因)\n申告書の事前送付等の申告指導及び調査の実施により、適正な申告及び納入を促進した。";
    expect(normalizePdfText(input)).toBe(input);
  });

  it("文末（。）の後の改行は残す", () => {
    expect(normalizePdfText("一文目です。\n二文目です。")).toBe(
      "一文目です。\n二文目です。"
    );
  });

  it("箇条書きの前の改行は残す", () => {
    const input = "次の取組を行う。\n・研修の実施\n・広報の強化";
    expect(normalizePdfText(input)).toBe(input);
  });

  it("箇条書き自体が折り返していれば畳む", () => {
    const input =
      "・特別徴収義務者へのアンケート調査により、課税標準に対する\n認識を把握する";
    expect(normalizePdfText(input)).toBe(
      "・特別徴収義務者へのアンケート調査により、課税標準に対する認識を把握する"
    );
  });

  it("丸数字・番号付きの行頭は改行を残す", () => {
    expect(normalizePdfText("対象は次のとおり\n①県内事業者\n②県外事業者")).toBe(
      "対象は次のとおり\n①県内事業者\n②県外事業者"
    );
    expect(normalizePdfText("手順\n1. 申請\n2. 審査")).toBe(
      "手順\n1. 申請\n2. 審査"
    );
  });

  it("空行（段落区切り）は残す", () => {
    expect(normalizePdfText("前段の文。\n\n後段の文。")).toBe(
      "前段の文。\n\n後段の文。"
    );
  });

  it("null / 空文字は null", () => {
    expect(normalizePdfText(null)).toBeNull();
    expect(normalizePdfText(undefined)).toBeNull();
    expect(normalizePdfText("")).toBeNull();
    expect(normalizePdfText("   ")).toBeNull();
  });

  it("改行が無ければそのまま", () => {
    expect(normalizePdfText("単一行のテキスト。")).toBe("単一行のテキスト。");
  });

  it("【】見出しの前の改行は残す", () => {
    const input = "本文の続き\n【見直し内容】\n次年度の方針";
    expect(normalizePdfText(input)).toBe(input);
  });
});
