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
  /**
   * 議員別の賛否まで入っているか。
   * 賛否は市議会だよりの一覧表からしか取れず、だよりは定例会のおよそ2か月後に出る。
   * 直近の会期は必ず false になるので、どこまで反映済みかの表示に使う。
   */
  hasMemberVotes: boolean;
};
