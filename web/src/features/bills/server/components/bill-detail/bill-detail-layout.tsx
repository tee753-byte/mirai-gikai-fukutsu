import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { BillInterviewOpinionsSection } from "@/features/interview-report/server/components/bill-interview-opinions-section";
import { getPublicReportsByBillId } from "@/features/interview-report/server/loaders/get-public-reports-by-bill-id";
import { BillDetailClient } from "../../../client/components/bill-detail/bill-detail-client";
import { BillDisclaimer } from "../../../client/components/bill-detail/bill-disclaimer";
import { BillStatusProgress } from "../../../client/components/bill-detail/bill-status-progress";
import { FactionStanceCard } from "../../../client/components/bill-detail/faction-stance-card";
import type { BillWithContent } from "../../../shared/types";
import { getBillDiscussions } from "../../loaders/get-bill-discussions";
import { getRelatedBills } from "../../loaders/get-related-bills";
import { BillShareButtons } from "../share/bill-share-buttons";
import { BillContent } from "./bill-content";
import { BillDetailHeader } from "./bill-detail-header";
import { BillDiscussionsSection } from "./bill-discussions-section";
import { BillVoteSection } from "./bill-vote-section";
import { RelatedBillsSection } from "./related-bills-section";

interface BillDetailLayoutProps {
  bill: BillWithContent;
  currentDifficulty: DifficultyLevelEnum;
}

export async function BillDetailLayout({
  bill,
  currentDifficulty,
}: BillDetailLayoutProps) {
  const showStances =
    bill.status === "preparing" ||
    (bill.faction_stances && bill.faction_stances.length > 0);

  const [interviewConfig, publicReportsResult, discussions, relatedBills] =
    await Promise.all([
      getInterviewConfig(bill.id),
      getPublicReportsByBillId(bill.id),
      getBillDiscussions(bill.id),
      getRelatedBills(bill.council_session?.slug, bill.bill_number),
    ]);

  return (
    <div className="container mx-auto pb-8 max-w-4xl">
      {/*
        テキスト選択機能とチャット連携の実装パターン:
        - BillContentはServer Componentのまま保持（SSRによる高速な初期レンダリング）
        - BillDetailClientでクライアントサイド機能（テキスト選択、チャット連携）を提供
        - このパターンによりSSRを保持しつつインタラクティブ機能を実装
      */}
      <BillDetailClient
        bill={bill}
        currentDifficulty={currentDifficulty}
        hasInterviewConfig={interviewConfig != null}
      >
        <BillDetailHeader
          bill={bill}
          hasInterviewConfig={interviewConfig != null}
        />
        <Container>
          {/* 議案ステータス進捗 */}
          <div className="my-8">
            <BillStatusProgress
              status={bill.status}
              statusNote={bill.status_note}
              billType={bill.bill_type}
            />
          </div>

          <BillContent bill={bill} />
          {discussions.length > 0 && (
            <div className="my-8">
              <BillDiscussionsSection
                discussions={discussions}
                overviewPoints={bill.discussion_overview_points ?? []}
              />
            </div>
          )}
        </Container>
      </BillDetailClient>

      <Container>
        {/* 誰が賛成し、誰が反対したか（討論・提出者・議員別賛否） */}
        <div className="my-8">
          <BillVoteSection billId={bill.id} voteMethod={bill.vote_method} />
        </div>

        {/*
          賛否のすぐ下に置く。会議録が未公開の会期は賛否が空になるので、
          そこで行き止まりにせず、同じ議案が読める会期へ渡す
        */}
        <div className="my-8">
          <RelatedBillsSection related={relatedBills} />
        </div>

        {siteConfig.features.aiInterview && interviewConfig != null && (
          <div className="my-8">
            <InterviewLandingSection
              billId={bill.id}
              estimatedDuration={interviewConfig.estimated_duration}
            />
          </div>
        )}
        {publicReportsResult.totalCount > 0 && (
          <div className="my-8">
            <BillInterviewOpinionsSection
              billId={bill.id}
              reports={publicReportsResult.reports}
              totalCount={publicReportsResult.totalCount}
            />
          </div>
        )}
        {showStances && (
          <div className="my-8">
            <FactionStanceCard
              stances={bill.faction_stances ?? []}
              billStatus={bill.status}
            />
          </div>
        )}
        {/* シェアボタン */}
        <div className="my-8">
          <BillShareButtons bill={bill} />
        </div>

        {/* データの出典と免責事項 */}
        <div className="my-8">
          <BillDisclaimer />
        </div>
      </Container>
    </div>
  );
}
