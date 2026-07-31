export type CouncilSession = {
  id: string;
  name: string;
  slug: string | null;
  council_url: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** 会期一覧カードに出す簡易集計（議会ごとのまとめページ用） */
export type SessionSummary = {
  billCount: number;
  splitVoteCount: number;
  generalQuestionsCount: number;
};
