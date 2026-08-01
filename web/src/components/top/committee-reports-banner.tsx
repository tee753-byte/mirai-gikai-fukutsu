import { ArrowRight, Users2 } from "lucide-react";
import Link from "next/link";

export function CommitteeReportsBanner() {
  return (
    <Link
      href="/committee-reports"
      className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start gap-3">
        <Users2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-mirai-text">委員会報告</p>
          <p className="mt-0.5 text-sm text-mirai-text-secondary">
            本会議の前に、常任委員会でどんなやり取りがあったかをわかりやすく解説します
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-mirai-text-muted shrink-0" />
    </Link>
  );
}
