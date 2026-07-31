import type { QuestionerGroup } from "./build-questioner-groups";

export type PartyGroup = {
  partyLabel: string;
  members: QuestionerGroup[];
};

const INDEPENDENT_LABEL = "無所属";
const UNKNOWN_LABEL = "会派情報なし";

/**
 * 議員一覧を会派ごとにまとめる。
 * 無所属を最上部に固定し、残りは人数の多い会派から並べる（田川市版を参考）。
 * 会派情報が無い（会議録・一般質問データに会派が記録されていない）議員は最後にまとめる。
 * 会派内の並び順は既存の `buildQuestionerGroups` の並び（氏名順）をそのまま使う。
 */
export function groupQuestionersByParty(
  questioners: QuestionerGroup[]
): PartyGroup[] {
  const byParty = new Map<string, QuestionerGroup[]>();

  for (const q of questioners) {
    const label = q.party ?? UNKNOWN_LABEL;
    const members = byParty.get(label);
    if (members) {
      members.push(q);
    } else {
      byParty.set(label, [q]);
    }
  }

  const independent = byParty.get(INDEPENDENT_LABEL) ?? [];
  byParty.delete(INDEPENDENT_LABEL);

  const unknown = byParty.get(UNKNOWN_LABEL) ?? [];
  byParty.delete(UNKNOWN_LABEL);

  const others = [...byParty.entries()].sort(([labelA, a], [labelB, b]) => {
    if (a.length !== b.length) return b.length - a.length;
    return labelA.localeCompare(labelB, "ja");
  });

  const groups: PartyGroup[] = [];
  if (independent.length > 0) {
    groups.push({ partyLabel: INDEPENDENT_LABEL, members: independent });
  }
  for (const [partyLabel, members] of others) {
    groups.push({ partyLabel, members });
  }
  if (unknown.length > 0) {
    groups.push({ partyLabel: UNKNOWN_LABEL, members: unknown });
  }

  return groups;
}
