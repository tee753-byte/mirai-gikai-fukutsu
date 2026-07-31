import type {
  SeedGeneralQuestion,
  SeedTopicExchange,
} from "./general-questions-types";

/** 議員名 → 大項目の見出し → 論点ごとのやり取り */
export type DigestMap = Record<string, Record<string, SeedTopicExchange[]>>;

export type MergeDigestResult = {
  questions: SeedGeneralQuestion[];
  /** 突き合わせできなかった見出し。誤字で黙って落ちるのを防ぐために返す */
  unmatched: string[];
  /** 実際に流し込めた論点の数 */
  mergedCount: number;
};

/** 会議録の氏名は全角スペース入りなので、突き合わせ前に空白を取る */
function stripSpaces(name: string): string {
  return name.replace(/[\s　]/g, "");
}

/**
 * 一般質問のシードデータに、やり取りのダイジェストを流し込む。
 * 元の配列は書き換えず、新しい配列を返す。
 */
export function mergeDigest(
  questions: SeedGeneralQuestion[],
  digest: DigestMap
): MergeDigestResult {
  const digestByName = new Map(
    Object.entries(digest).map(([name, byTitle]) => [
      stripSpaces(name),
      byTitle,
    ])
  );

  // 使われた見出しを記録し、あとで余りを警告に回す
  const usedTitles = new Set<string>();
  let mergedCount = 0;

  const merged = questions.map((q) => {
    const byTitle = digestByName.get(stripSpaces(q.questioner_name));
    if (!byTitle) return q;

    return {
      ...q,
      topics: q.topics.map((topic) => {
        const exchanges = byTitle[topic.title];
        if (!exchanges || exchanges.length === 0) return topic;

        usedTitles.add(`${stripSpaces(q.questioner_name)}／${topic.title}`);
        mergedCount += exchanges.length;
        return { ...topic, exchanges };
      }),
    };
  });

  const unmatched: string[] = [];
  for (const [name, byTitle] of digestByName) {
    for (const title of Object.keys(byTitle)) {
      if (!usedTitles.has(`${name}／${title}`)) {
        unmatched.push(`${name}／${title}`);
      }
    }
  }

  return { questions: merged, unmatched, mergedCount };
}
