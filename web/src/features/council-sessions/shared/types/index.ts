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
   * 会議録まで入っているか。
   * 会議録は議会が終わってからおよそ2〜3か月後に公開され、それまでは
   * 提案理由の説明・討論・採決の方法を載せられない。
   * 採決の方法（vote_method）は会議録にしか記録がないので、それを目印にする。
   */
  hasMinutes: boolean;
  /**
   * 議員別の賛否まで入っているか。
   * 賛否は市議会だよりの一覧表からしか取れず、だよりは定例会のおよそ2か月後に出る。
   * 直近の会期は必ず false になるので、どこまで反映済みかの表示に使う。
   */
  hasMemberVotes: boolean;
};
