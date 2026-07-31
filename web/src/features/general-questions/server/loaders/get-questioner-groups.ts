import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  buildQuestionerGroups,
  type QuestionerGroup,
} from "../../shared/utils/build-questioner-groups";
import { findAllPublishedGeneralQuestions } from "../repositories/general-questions-repository";

/** 公開済みの一般質問を議員ごとにまとめて返す */
export async function getQuestionerGroups(): Promise<QuestionerGroup[]> {
  return _getCached();
}

const _getCached = unstable_cache(
  async (): Promise<QuestionerGroup[]> => {
    return buildQuestionerGroups(await findAllPublishedGeneralQuestions());
  },
  ["general-questions-questioner-groups"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.GENERAL_QUESTIONS],
  }
);
