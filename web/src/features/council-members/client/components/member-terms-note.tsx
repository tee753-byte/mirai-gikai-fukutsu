import { ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  MEMBER_PROFILE_SOURCE_DATE,
  MEMBER_ROSTER_URL,
} from "../../shared/member-profiles";

/**
 * 会派・党派の用語説明と、議員情報の出典。
 *
 * もともと議員ごとのページの基本情報カードに入れていたが、全議員のページに
 * 同じ説明が繰り返し出て、その議員自身の情報が読みにくくなっていた。
 * 用語の説明は一度読めば足りるので、議員一覧ページに1か所だけ置く。
 */
export function MemberTermsNote() {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs leading-relaxed text-mirai-text-muted">
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
