import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { MemberTermsNote } from "@/features/council-members/client/components/member-terms-note";
import { AttendanceMatrixSection } from "@/features/general-questions/server/components/attendance-matrix-table";
import { QuestionerListView } from "@/features/general-questions/server/components/questioner-list-view";
import { getAttendanceMatrix } from "@/features/general-questions/server/loaders/get-attendance-matrix";
import { getQuestionerGroups } from "@/features/general-questions/server/loaders/get-questioner-groups";

export const metadata: Metadata = {
  title: "議員から見る一般質問",
  description: `${siteConfig.councilName}の議員が、それぞれの定例会でどんな一般質問をしたのかを議員ごとにまとめています。`,
  alternates: { canonical: "/questions/members" },
};

export default async function QuestionMembersPage() {
  const [groups, attendance] = await Promise.all([
    getQuestionerGroups(),
    getAttendanceMatrix(),
  ]);

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
      <div className="mb-4">
        <MemberTermsNote />
      </div>
      {/*
        星取表は既定で閉じておく。目当ての議員を探しに来た人にとっては
        一覧本体が主役で、大きな表が先に開いていると邪魔になるため。
      */}
      <div className="mb-6">
        <AttendanceMatrixSection matrix={attendance.matrix} />
      </div>
      <QuestionerListView groups={groups} />
    </Container>
  );
}
