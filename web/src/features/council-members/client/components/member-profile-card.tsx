import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CouncilMemberProfile } from "../../shared/member-profiles";

type MemberProfileCardProps = {
  profile: CouncilMemberProfile;
  /**
   * 政務活動費ページへのリンク先。データが無い・機能がオフの年度は undefined になる。
   * 会派に属する議員は、会派の報告書（自分の個別ページは無い）に飛ぶ。
   */
  seimuKatsudohiLink?: {
    fiscalYearSlug: string;
    groupSlug: string;
    groupName: string;
  };
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
 * 会派・党派の用語説明と出典は、議員一覧ページ（MemberTermsNote）にまとめている。
 * 議員ごとのページに毎回同じ説明が入ると、その議員の情報が読みにくくなるため。
 */
export function MemberProfileCard({
  profile,
  seimuKatsudohiLink,
}: MemberProfileCardProps) {
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

      {seimuKatsudohiLink && (
        <Link
          href={`/seimu-katsudohi/${seimuKatsudohiLink.fiscalYearSlug}/${encodeURIComponent(seimuKatsudohiLink.groupSlug)}`}
          className="mt-3 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-mirai-text hover:border-primary transition-colors"
        >
          <span>
            政務活動費を見る
            {/* 会派の場合だけ「（会派名）」を添える。無会派は自分自身の名前なので不要 */}
            {seimuKatsudohiLink.groupName.replace(/[\s　]/g, "") !==
              profile.name.replace(/[\s　]/g, "") &&
              `（${seimuKatsudohiLink.groupName}）`}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-mirai-text-muted" />
        </Link>
      )}
    </section>
  );
}
