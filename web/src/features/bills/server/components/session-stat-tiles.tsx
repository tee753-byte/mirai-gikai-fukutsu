import Link from "next/link";

type SessionStatTilesProps = {
  total: number;
  approved: number;
  rejected: number;
  splitVotes: number;
  generalQuestionsCount: number;
  /** 一般質問タイルのリンク先。無ければリンクにしない（一般質問が0件の会期など） */
  generalQuestionsHref?: string;
  /**
   * 総括質疑の件数。3月定例会など、総括質疑が行われた会期にだけ渡す。
   * 「3月かどうか」ではなく「データがあるかどうか」でタイルの表示を切り替える
   * （総括質疑を行う会派は年によって異なるため）。
   */
  sokatsuQuestionsCount?: number;
  sokatsuQuestionsHref?: string;
};

/** 会期詳細ページの「数字でみるこの会期」タイル */
export function SessionStatTiles({
  total,
  approved,
  rejected,
  splitVotes,
  generalQuestionsCount,
  generalQuestionsHref,
  sokatsuQuestionsCount,
  sokatsuQuestionsHref,
}: SessionStatTilesProps) {
  const tiles = [
    { label: "提出議案", value: total, href: undefined },
    { label: "可決・同意など", value: approved, href: undefined },
    { label: "否決・不採択など", value: rejected, href: undefined },
    { label: "賛否が分かれた案件", value: splitVotes, href: undefined },
    {
      label: "一般質問",
      value: generalQuestionsCount,
      href: generalQuestionsHref,
    },
    ...(sokatsuQuestionsCount
      ? [
          {
            label: "総括質疑",
            value: sokatsuQuestionsCount,
            href: sokatsuQuestionsHref,
          },
        ]
      : []),
  ];

  return (
    <div
      className={`grid grid-cols-2 gap-3 ${tiles.length > 5 ? "sm:grid-cols-3" : "sm:grid-cols-5"}`}
    >
      {tiles.map((tile) => {
        const content = (
          <>
            <p className="text-2xl font-bold text-mirai-text">{tile.value}</p>
            <p className="mt-1 text-xs text-mirai-text-secondary">
              {tile.label}
            </p>
          </>
        );

        if (tile.href) {
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="rounded-xl border border-border bg-card px-4 py-3 text-center hover:bg-mirai-surface-muted"
            >
              {content}
            </Link>
          );
        }

        return (
          <div
            key={tile.label}
            className="rounded-xl border border-border bg-card px-4 py-3 text-center"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
