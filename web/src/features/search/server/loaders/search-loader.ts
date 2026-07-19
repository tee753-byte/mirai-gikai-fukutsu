import "server-only";
import type { SearchResults } from "../../shared/types/search-types";
import {
  searchBills,
  searchBudgets,
  searchCommittees,
  searchGeneralQuestions,
} from "../repositories/search-repository";

export async function loadSearchResults(query: string): Promise<SearchResults> {
  const [bills, questions, budgets, committees] = await Promise.all([
    searchBills(query),
    searchGeneralQuestions(query),
    searchBudgets(query),
    searchCommittees(query),
  ]);
  return { bills, questions, budgets, committees };
}
