/**
 * トピックス（市政の注目テーマ）の型。
 *
 * 中立性の担保のため、型のレベルで次の2つを分けている（CLAUDE.md の中立性・運営方針）。
 *  - facts    … 市側の答弁・議決結果など、記録上そうであると確認できる事実
 *  - stances  … 議員が討論で述べた主張。事実認定ではないため必ず賛否の両側を併記する
 *
 * また、特定の議員を目立たせないため討論の発言者名は載せない
 * （誰の発言かは sources の会議録で確認できる）。
 */

export type TopicStance = {
  side: "for" | "against";
  /** 討論での主張の要旨。評価語を足さず、述べられた内容のみを書く */
  text: string;
};

export type TopicSource = {
  label: string;
  href: string;
};

export type Topic = {
  slug: string;
  /** 見出し。主語は「市」「市議会」にし、質問した議員を主役にしない */
  title: string;
  /** どの会議のことか（例:「令和8年3月定例会」） */
  sessionLabel: string;
  /** 出来事があった日 */
  occurredOn: string;
  /** 何が起きたかを1〜2文で。事実のみ */
  lead: string;
  /** 関係する議案の議決結果。複数議案や議決を伴わないものは null */
  outcome: "approved" | "rejected" | null;
  /** 議決結果の補足（例:「関係する5議案がいずれも否決」） */
  outcomeNote: string | null;
  /** 確認できる事実。評価や解釈は書かない */
  facts: string[];
  /** 討論での主な主張（賛成・反対の両方） */
  stances: TopicStance[];
  /** 討論についての注記（例: 反対討論が無かった場合など） */
  stanceNote: string | null;
  sources: TopicSource[];
};
