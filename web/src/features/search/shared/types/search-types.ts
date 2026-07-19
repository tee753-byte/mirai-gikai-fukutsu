export type SearchTab = "all" | "bills" | "questions" | "budget" | "committees";

export type BillSearchResult = {
  id: string;
  title: string;
  summary: string | null;
  session: string;
  publishedAt: string | null;
  tags: string[];
};

export type QuestionSearchResult = {
  id: string;
  questioner: string;
  topics: string[];
  summary: string | null;
  session: string;
};

export type BudgetSearchResult = {
  id: string;
  departmentName: string;
  direction: string | null;
  session: string;
  sessionSlug: string;
  departmentSlug: string;
};

export type CommitteeSearchResult = {
  id: string;
  committeeName: string;
  committeeSlug: string;
  title: string;
  summary: string | null;
  meetingDate: string;
  sourceDocumentId: number;
  matchedTopics: string[];
};

export type SearchResults = {
  bills: BillSearchResult[];
  questions: QuestionSearchResult[];
  budgets: BudgetSearchResult[];
  committees: CommitteeSearchResult[];
};
