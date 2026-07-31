export type VoteCounts = { for: number; against: number };

/** 賛成・反対の一方が0人で、もう一方が1人以上のとき「全会一致」として扱う */
export function isUnanimousVote({
  for: forCount,
  against,
}: VoteCounts): boolean {
  return (forCount > 0 && against === 0) || (against > 0 && forCount === 0);
}
