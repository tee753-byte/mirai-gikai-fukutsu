import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { CouncilMemberProfile } from "../../shared/member-profiles";
import {
  MEMBER_PROFILE_SOURCE_DATE,
  MEMBER_ROSTER_URL,
} from "../../shared/member-profiles";

type MemberProfileCardProps = {
  profile: CouncilMemberProfile;
};

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-20 shrink-0 text-xs text-mirai-text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-mirai-text">{value}</dd>
    </div>
  );
}

/**
 * 議員の基本情報カード。
 *
 * これまで議員ページには氏名と会派しか出ていなかった。どの委員会に属しているかは、
 * その議員がどの分野の議案を審査しているかに直結するため、質問の一覧より先に置く。
 *
 * 会派と党派は市民には区別がつきにくいので、一言ずつ説明を添える。
 */
export function MemberProfileCard({ profile }: MemberProfileCardProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <dl className="divide-y divide-border">
        <ProfileRow label="会派" value={profile.caucus} />
        <ProfileRow label="党派" value={profile.party} />
        <ProfileRow label="当選回数" value={`${profile.terms}回`} />
        <ProfileRow
          label="所属委員会"
          // 議長は常任委員会に属さない。空欄にすると情報の抜けに見えるため理由を書く
          value={profile.committee ?? "なし（議長は常任委員会に所属しません）"}
        />
      </dl>

      <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-mirai-text-muted">
        <strong className="font-bold text-mirai-text-secondary">会派</strong>
        は、議会の中で考えの近い議員がつくる集まりです。委員会の割り当てや質問の
        順番などがこの単位で決まります。
        <strong className="ml-1 font-bold text-mirai-text-secondary">
          党派
        </strong>
        は所属している政党のことで、会派とは別のものです。
      </p>

      <Link
        href={MEMBER_ROSTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs text-mirai-text-muted hover:text-mirai-text"
      >
        <ExternalLink className="h-3 w-3 shrink-0" />
        出典：福津市議会 議員名簿（{MEMBER_PROFILE_SOURCE_DATE}時点）
      </Link>
    </section>
  );
}
