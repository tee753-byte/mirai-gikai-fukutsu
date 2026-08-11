import { unstable_cache } from "next/cache";
import { COUNCIL_MEMBER_PROFILES } from "@/features/council-members/shared/member-profiles";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  buildQuestionerGroups,
  type QuestionerGroup,
} from "../../shared/utils/build-questioner-groups";
import { findAllPublishedGeneralQuestions } from "../repositories/general-questions-repository";

/**
 * 名簿上はいるが、一般質問も総括質疑も一度も行っていない議員を0回の議員として補う。
 *
 * 一般質問データだけから一覧を組み立てると、質問実績が無い議員は最初から
 * 一覧に出てこず、「そもそも名簿にいない」のか「まだ実績が無いだけ」なのか
 * 区別がつかない。全議員を同じ基準で載せるため、名簿（COUNCIL_MEMBER_PROFILES）
 * にいる議員は実績0件でも「0回の定例会」として一覧に出す。
 */
function fillMissingRosterMembers(
  groups: QuestionerGroup[]
): QuestionerGroup[] {
  const presentSlugs = new Set(groups.map((g) => g.slug));

  const missing: QuestionerGroup[] = COUNCIL_MEMBER_PROFILES.filter(
    (profile) => !presentSlugs.has(profile.slug)
  ).map((profile) => ({
    slug: profile.slug,
    name: profile.name,
    // 一般質問データ側は会派を「無所属」と記録しているため、表記をそろえる
    party: profile.caucus === "無会派" ? "無所属" : profile.caucus,
    entries: [],
  }));

  return [...groups, ...missing];
}

/** 全議員（名簿）を、一般質問・総括質疑の実績とあわせて返す */
export async function getQuestionerGroups(): Promise<QuestionerGroup[]> {
  return _getCached();
}

const _getCached = unstable_cache(
  async (): Promise<QuestionerGroup[]> => {
    const groups = buildQuestionerGroups(
      await findAllPublishedGeneralQuestions()
    );
    return fillMissingRosterMembers(groups);
  },
  ["general-questions-questioner-groups"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.GENERAL_QUESTIONS],
  }
);
