/**
 * 議員別賛否の出典（votes[].source_note）を重複排除して集める。
 *
 * 議員別賛否は録画確認など複数の出典が混在することがある。
 * 先頭1件だけを表示すると、別の出典で確認した議員分が
 * 出典なしであるかのように見えてしまうため、全ての出典を漏らさず出す。
 */
export function collectVoteSources(
  votes: { source_note: string | null }[]
): string[] {
  const seen = new Set<string>();
  const sources: string[] = [];

  for (const vote of votes) {
    const note = vote.source_note?.trim();
    if (!note || seen.has(note)) continue;
    seen.add(note);
    sources.push(note);
  }

  return sources;
}
