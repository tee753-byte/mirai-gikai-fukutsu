/**
 * Fork元から引き継いだ議案コンテンツの置き場。
 *
 * 福津版の議案本文（やさしい版・くわしい版）は、全会期を
 * fukutsu/seed-bills-common.ts の seedBillsForSession() が組み立てている。
 *
 * 令和8年6月定例会（r8-6）だけは会議録の公開前にここで組み立てていたが、
 * 会議録が公開され、提案理由の説明・討論・採決の方法まで載せられるようになったため
 * fukutsu/bills-r8-6.ts に移した。平易なタイトル・要約・議案書の理由も
 * そちらに引き継いである。
 *
 * この配列は空のままにしておく。会期を足すときは fukutsu/sessions.ts に追加すること。
 * （Fork元の更新を取り込みやすくするため、export と型はそのまま残している）
 */
type DifficultyLevel = "normal" | "hard";

interface BillContentWithBillName {
  bill_name: string;
  difficulty_level: DifficultyLevel;
  title: string;
  summary: string;
  content: string;
}

export const billContentsWithBillName: BillContentWithBillName[] = [];

// bill_nameをbill_idに変換する関数
export function createBillContents(
  insertedBills: { id: string; name: string }[]
) {
  return billContentsWithBillName.map((content) => {
    const bill = insertedBills.find((b) => b.name === content.bill_name);
    if (!bill) {
      throw new Error(`Bill not found for content: ${content.bill_name}`);
    }

    return {
      bill_id: bill.id,
      difficulty_level: content.difficulty_level,
      title: content.title,
      summary: content.summary,
      content: content.content,
    };
  });
}
