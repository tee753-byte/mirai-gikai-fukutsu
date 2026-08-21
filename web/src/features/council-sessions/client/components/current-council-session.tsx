import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDateWithDots } from "@/lib/utils/date";
import type { CouncilSession } from "../../shared/types";

type CurrentCouncilSessionProps = {
  session: CouncilSession | null;
  /**
   * 閉会中のときだけ使う、次に開会予定の定例会。
   * 会期日程・一般質問通告書が公開されてから開会するまでの間、
   * 「もうすぐ始まる」ことを案内するために表示する。
   */
  upcomingSession?: CouncilSession | null;
};

export function CurrentCouncilSession({
  session,
  upcomingSession,
}: CurrentCouncilSessionProps) {
  const showUpcoming =
    session == null && upcomingSession != null && upcomingSession.slug;

  return (
    <div className="w-full bg-mirai-surface-warm px-6 py-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold text-gray-800 leading-[0.9]">
              本日は
            </h2>
            <div
              className={`
              inline-flex items-center justify-center px-5 py-1.5 rounded-[50px]  shrink-0
              ${session == null ? "bg-mirai-border-muted" : "bg-mirai-gradient"}
              `}
            >
              <span className="text-base font-bold leading-[1.48]">
                {session == null ? "閉会中" : "開会中"}
              </span>
            </div>
          </div>
          {session != null && (
            <div className="text-sm leading-[1.5] shrink-0">
              <div>{session.name}</div>
              <div>{formatDateWithDots(session.start_date)}〜</div>
            </div>
          )}
        </div>

        {showUpcoming && (
          <>
            <div className="h-px bg-mirai-border" />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-sm text-mirai-text-secondary">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  <b className="text-mirai-text">{upcomingSession.name}</b>は
                  {formatDateWithDots(upcomingSession.start_date)}開会予定
                </span>
              </div>
              <Link
                href={`/sessions/${upcomingSession.slug}/preview`}
                className="inline-flex items-center gap-1 self-start text-sm font-bold text-primary underline underline-offset-2 hover:opacity-70"
              >
                会期日程・質問予定を見る
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
