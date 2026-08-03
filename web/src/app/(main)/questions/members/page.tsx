import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { MemberTermsNote } from "@/features/council-members/client/components/member-terms-note";
import { QuestionerListView } from "@/features/general-questions/server/components/questioner-list-view";
import { getQuestionerGroups } from "@/features/general-questions/server/loaders/get-questioner-groups";

export const metadata: Metadata = {
  title: `議員から見る一般質問 | ${siteConfig.siteName}`,
  description: `${siteConfig.councilName}の議員が、それぞれの定例会でどんな一般質問をしたのかを議員ごとにまとめています。`,
};

export default async function QuestionMembersPage() {
  const groups = await getQuestionerGroups();

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mirai-text">議員から見る</h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          どの議員がどんなテーマを取り上げたのかを、議員ごとにまとめました。
        </p>
        <p className="mt-2 text-xs text-mirai-text-secondary">
          掲載の基準は全議員で同じです。質問の回数や発言の量では並べ替えていません。
        </p>
      </div>
      {/* 用語の説明は一度読めば足りるので、議員ごとのページではなくここに置く */}
      <div className="mb-6">
        <MemberTermsNote />
      </div>
      <QuestionerListView groups={groups} />
    </Container>
  );
}
