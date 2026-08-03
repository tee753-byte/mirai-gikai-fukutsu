import { describe, expect, it } from "vitest";
import {
  type BillContentInput,
  buildHardContent,
  buildNormalContent,
} from "./bill-content-format";

const BASE: BillContentInput = {
  subject: "議案",
  billName: "福津市○○条例の一部を改正する条例の制定について",
  sources: [{ label: "この定例会のページ（福津市公式）", url: "https://例" }],
  hasMinutes: true,
  hasMemberVotes: true,
  aiSourceLabel: "議案書と会議録に記録された市の説明",
  originalDocumentNote: "議案書そのものは再掲載していません。",
};

/** 見出しだけを出現順に取り出す */
function headings(content: string): string[] {
  return content
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace("## ", ""));
}

describe("buildNormalContent", () => {
  it("理由がやさしく書かれていれば、本文の先頭に置く", () => {
    const content = buildNormalContent({
      ...BASE,
      reasonPlain: "市は、法律が変わったため条例を直す必要があると説明しています。",
    });

    expect(headings(content)[0]).toBe("なぜ出されたのか");
    expect(content).toContain(
      "市は、法律が変わったため条例を直す必要があると説明しています。"
    );
  });

  it("理由の材料が無い議案では、節ごと出さない", () => {
    // 予算議案は議案書に理由欄が無く、会議録にも提案理由の説明が残っていない
    const content = buildNormalContent(BASE);

    expect(content).not.toContain("なぜ出されたのか");
    expect(headings(content)[0]).toBe("元の資料");
  });

  it("理由の記録が無い議案には、しくみの説明を置く", () => {
    const content = buildNormalContent({
      ...BASE,
      systemNote: "予算の議案には、議案書に理由が書かれていません。",
    });

    // 誰かの説明ではないので、見出しを「なぜ出されたのか」にしない
    expect(headings(content)[0]).toBe("どんな議案か");
    expect(content).not.toContain("なぜ出されたのか");
  });

  it("理由があるときは、しくみの説明よりそちらを優先する", () => {
    const content = buildNormalContent({
      ...BASE,
      reasonPlain: "市は、条例を直す必要があると説明しています。",
      systemNote: "これは出ないはず",
    });

    expect(headings(content)[0]).toBe("なぜ出されたのか");
    expect(content).not.toContain("これは出ないはず");
  });

  it("議決の結果は本文に書かない", () => {
    // すぐ上の審議のステータスカードが同じ一文をそのまま表示している
    const content = buildNormalContent({
      ...BASE,
      reasonPlain: "市は、条例を直す必要があると説明しています。",
    });

    expect(content).not.toContain("どうなったか");
  });

  it("原文がくわしい版にあるときは、そこで読めることを案内する", () => {
    const content = buildNormalContent({
      ...BASE,
      reasonPlain: "市は、条例を直す必要があると説明しています。",
      documentReason: "法律の改正に伴い、所要の改正を行う。",
      proposalReason: "所要の改正を行うものでございます。",
    });

    expect(content).toContain(
      "議案書に記載された理由と、市が議会で説明した提案理由の原文は、「説明をもっと詳しく」に切り替えると読めます。"
    );
  });

  it("請願は委員長報告だけが原文なので、それを案内する", () => {
    // 請願書は非公開資料で、市の提案理由の説明も存在しない
    const content = buildNormalContent({
      ...BASE,
      subject: "請願",
      reasonPlain: "請願を審査した委員会では、賛成の意見が出されました。",
      committeeReport: "審査内容。（１）主な質疑及び答弁。",
    });

    expect(content).toContain(
      "委員会での審査の原文は、「説明をもっと詳しく」に切り替えると読めます。"
    );
  });

  it("議案書の理由があるときは、委員長報告を案内文に足さない", () => {
    // 原文が読めること自体は伝わるので、一文を長くしない
    const content = buildNormalContent({
      ...BASE,
      reasonPlain: "市は、条例を直す必要があると説明しています。",
      documentReason: "法律の改正に伴い、所要の改正を行う。",
      committeeReport: "審査内容。",
    });

    expect(content).not.toContain("委員会での審査");
  });

  it("原文がひとつも無ければ、読めない場所へ案内しない", () => {
    const content = buildNormalContent({
      ...BASE,
      reasonPlain: "市は、条例を直す必要があると説明しています。",
    });

    expect(content).not.toContain("説明をもっと詳しく");
  });

  it("発議は、説明したのが市ではなく提出した議員であることを示す", () => {
    // 発議の理由は市の説明ではなく提出者の主張。主語を取り違えると、
    // 議員の主張を市の説明として読ませてしまう
    const content = buildNormalContent({
      ...BASE,
      isMemberBill: true,
      reasonPlain: "提出した議員は、原因の究明が必要だと説明しています。",
      proposalReason: "次のとおり提出いたします。",
    });

    expect(content).toContain("提出した議員が議会で説明した提案理由の原文は");
    expect(content).not.toContain("市が議会で説明した提案理由");
  });
});

describe("buildHardContent", () => {
  it("やさしく書き直した理由は載せず、原文だけを引用する", () => {
    const content = buildHardContent({
      ...BASE,
      reasonPlain: "市は、条例を直す必要があると説明しています。",
      documentReason: "法律の改正に伴い、所要の改正を行う。",
    });

    expect(content).not.toContain("なぜ出されたのか");
    expect(headings(content)[0]).toBe("議案書に記載された理由");
    expect(content).toContain("> 法律の改正に伴い、所要の改正を行う。");
  });

  it("発議の提案理由に「市が説明した」という見出しを付けない", () => {
    const content = buildHardContent({
      ...BASE,
      isMemberBill: true,
      proposalReason: "次のとおり提出いたします。",
    });

    expect(content).toContain("## 提出した議員が議会で説明した提案理由");
    expect(content).not.toContain("## 市が議会で説明した提案理由");
  });
});
