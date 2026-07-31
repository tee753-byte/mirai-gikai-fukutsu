type SessionStatTilesProps = {
  total: number;
  approved: number;
  rejected: number;
  splitVotes: number;
  generalQuestionsCount: number;
};

/** 会期詳細ページの「数字でみるこの会期」タイル */
export function SessionStatTiles({
  total,
  approved,
  rejected,
  splitVotes,
  generalQuestionsCount,
}: SessionStatTilesProps) {
  const tiles = [
    { label: "提出議案", value: total },
    { label: "可決・同意など", value: approved },
    { label: "否決・不採択など", value: rejected },
    { label: "賛否が分かれた案件", value: splitVotes },
    { label: "一般質問", value: generalQuestionsCount },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-xl border border-border bg-card px-4 py-3 text-center"
        >
          <p className="text-2xl font-bold text-mirai-text">{tile.value}</p>
          <p className="mt-1 text-xs text-mirai-text-secondary">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}
