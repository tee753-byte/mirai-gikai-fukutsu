import "server-only";
import { Info } from "lucide-react";
import { DebateSpeech } from "../../../client/components/bill-detail/debate-speech";
import { collectVoteSources } from "../../../shared/utils/collect-vote-sources";
import { isUnanimousVote } from "../../../shared/utils/vote-counts";
import { getBillVotes } from "../../loaders/get-bill-votes";

/** 採決のとり方を市民向けの一文にする。seed 側の describeVoteMethod と同じ表現 */
const VOTE_METHOD_LABELS: Record<string, string> = {
  majority: "起立採決（賛成多数）",
  minority: "起立採決（賛成少数）",
  chairDecision: "起立採決で可否同数となり、議長が裁決",
  noObjection: "異議なしで決定",
};

type Props = {
  billId: string;
  voteMethod: string | null;
};

export async function BillVoteSection({ billId, voteMethod }: Props) {
  const { debates, sponsors, memberVotes } = await getBillVotes(billId);

  if (
    debates.length === 0 &&
    sponsors.length === 0 &&
    memberVotes.length === 0 &&
    !voteMethod
  ) {
    return null;
  }

  const proposers = sponsors.filter((s) => s.role === "proposer");
  const seconders = sponsors.filter((s) => s.role === "seconder");
  const against = debates.filter((d) => d.stance === "against");
  const forDebates = debates.filter((d) => d.stance === "for");

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-mirai-text">
        誰が賛成し、誰が反対したか
      </h2>

      {/* 発議は提出者と賛成者が会議録に読み上げられている */}
      {sponsors.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-mirai-text">提出者・賛成者</h3>
          <dl className="flex flex-col gap-2">
            {proposers.length > 0 && (
              <SponsorRow label="提出者" members={proposers} />
            )}
            {seconders.length > 0 && (
              <SponsorRow label="賛成者" members={seconders} />
            )}
          </dl>
        </div>
      )}

      {/* 議員別の賛否 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-mirai-text">議員別の賛否</h3>
        {memberVotes.length > 0 ? (
          <MemberVotes votes={memberVotes} />
        ) : (
          <p className="flex items-start gap-2 rounded-lg bg-mirai-surface-muted px-3 py-2.5 text-xs leading-relaxed text-mirai-text-secondary">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              福津市議会の採決は起立採決で行われ、
              <strong className="font-bold">
                議員一人ひとりの賛否は会議録に記録されていません
              </strong>
              。会議録に残るのは「賛成多数」「賛成少数」という結果だけです。
              そのため、このサイトでは本会議で意見を述べた議員（討論）を掲載しています。
            </span>
          </p>
        )}
      </div>

      {/* 採決のとり方 */}
      {voteMethod && VOTE_METHOD_LABELS[voteMethod] && (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-mirai-text">採決のとり方</h3>
          <p className="text-sm text-mirai-text">
            {VOTE_METHOD_LABELS[voteMethod]}
          </p>
        </div>
      )}

      {/* 討論 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-mirai-text">
          本会議での討論（
          {debates.length > 0 ? `${debates.length}人が発言` : "発言なし"}）
        </h3>

        {debates.length === 0 ? (
          <p className="rounded-lg bg-mirai-surface-muted px-3 py-2.5 text-xs leading-relaxed text-mirai-text-secondary">
            この議案について、本会議で賛成・反対の意見を述べた議員はいませんでした。
          </p>
        ) : (
          <>
            {/* 反対意見が無いのに否決された、といったことが分かるように件数を出す */}
            <p className="text-xs text-mirai-text-secondary">
              賛成の意見を述べた議員 {forDebates.length}人 ／
              反対の意見を述べた議員 {against.length}人
            </p>
            <div className="flex flex-col gap-2">
              {debates.map((d) => (
                <DebateSpeech
                  key={d.id}
                  stance={d.stance === "for" ? "for" : "against"}
                  speakerName={d.speaker_name}
                  speakerNumber={d.speaker_number}
                  speakerParty={d.speaker_party}
                  rawText={d.raw_text}
                />
              ))}
            </div>
            <p className="text-xs text-mirai-text-secondary">
              発言は公式会議録からの引用です。討論をしなかった議員の賛否は公表されていません。
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function SponsorRow({
  label,
  members,
}: {
  label: string;
  members: { id: string; member_name: string; member_party: string | null }[];
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <dt className="w-14 shrink-0 text-xs text-mirai-text-secondary">
        {label}
      </dt>
      <dd className="flex flex-wrap gap-2">
        {members.map((m) => (
          <span
            key={m.id}
            className="rounded-full border border-border bg-card px-3 py-1 text-sm text-mirai-text"
          >
            {m.member_name} 議員
            {m.member_party && (
              <span className="ml-1 text-xs text-mirai-text-secondary">
                {m.member_party}
              </span>
            )}
          </span>
        ))}
      </dd>
    </div>
  );
}

const VOTE_LABELS: Record<string, string> = {
  for: "賛成",
  against: "反対",
  absent: "欠席・退席",
};

function MemberVotes({
  votes,
}: {
  votes: {
    id: string;
    member_name: string;
    member_party: string | null;
    vote: string;
    source_note: string;
  }[];
}) {
  // 議長は採決に加わらないため通常は一覧に出さない。可否同数で議長裁決になった場合のみ、
  // 下に注記として表示する（表決に混ぜると「議長も賛成/反対した」と誤解されるため）。
  const groups = ["for", "against", "absent"] as const;
  const sources = collectVoteSources(votes);
  const forCount = votes.filter((v) => v.vote === "for").length;
  const againstCount = votes.filter((v) => v.vote === "against").length;
  const chairMembers = votes.filter((v) => v.vote === "chair");
  const isTie = chairMembers.length > 0 && forCount === againstCount;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-mirai-text-secondary">
        {isUnanimousVote({ for: forCount, against: againstCount })
          ? `全会一致（${forCount > 0 ? "賛成" : "反対"}${forCount + againstCount}人）`
          : `賛成 ${forCount}人 ／ 反対 ${againstCount}人`}
      </p>
      {groups.map((g) => {
        const members = votes.filter((v) => v.vote === g);
        if (members.length === 0) return null;
        return (
          <div key={g} className="flex flex-wrap items-baseline gap-2">
            <span
              className={`w-14 shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold ${
                g === "for"
                  ? "bg-bill-approved-bg text-bill-approved-text"
                  : g === "against"
                    ? "bg-bill-rejected-bg text-bill-rejected-text"
                    : "bg-bill-neutral-bg text-bill-neutral-text"
              }`}
            >
              {VOTE_LABELS[g]}
            </span>
            <span className="text-sm text-mirai-text">
              {members.map((m) => m.member_name).join("、")}
            </span>
          </div>
        );
      })}
      {isTie && (
        <p className="flex items-start gap-2 rounded-lg bg-mirai-surface-muted px-3 py-2.5 text-xs leading-relaxed text-mirai-text-secondary">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            賛成・反対が同数だったため、議長（
            {chairMembers.map((m) => m.member_name).join("、")}
            ）が採決に参加しました。
          </span>
        </p>
      )}
      <div className="text-xs text-mirai-text-secondary">
        {sources.map((source) => (
          <p key={source}>出典: {source}</p>
        ))}
      </div>
    </div>
  );
}
