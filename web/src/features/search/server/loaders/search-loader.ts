import "server-only";
import {
  searchBills,
  searchGeneralQuestions,
  searchBudgets,
} from "../repositories/search-repository";
import type { SearchResults } from "../../shared/types/search-types";

export async function loadSearchResults(query: string): Promise<SearchResults> {
  const [bills, questions, budgets] = await Promise.all([
    searchBills(query),
    searchGeneralQuestions(query),
    searchBudgets(query),
  ]);
  return { bills, questions, budgets };
}
