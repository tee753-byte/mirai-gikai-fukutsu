import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { GeneralQuestionWithSessionName } from "../repositories/general-questions-repository";
import { findPublishedGeneralQuestionById } from "../repositories/general-questions-repository";

export async function getGeneralQuestionById(
  id: string
): Promise<GeneralQuestionWithSessionName | null> {
  return _getCached(id);
}

const _getCached = unstable_cache(
  async (id: string): Promise<GeneralQuestionWithSessionName | null> => {
    return findPublishedGeneralQuestionById(id);
  },
  ["general-question-by-id"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.GENERAL_QUESTIONS],
  }
);
