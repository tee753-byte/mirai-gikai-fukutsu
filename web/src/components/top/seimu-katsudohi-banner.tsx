import { ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";

type SeimuKatsudohiBannerProps = {
  fiscalYearSlug: string;
};

export function SeimuKatsudohiBanner({
  fiscalYearSlug,
}: SeimuKatsudohiBannerProps) {
  return (
    <Link
      href={`/seimu-katsudohi/${fiscalYearSlug}`}
      className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start gap-3">
        <Wallet className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-mirai-text">政務活動費</p>
          <p className="mt-0.5 text-sm text-mirai-text-secondary">
            会派・議員に交付されている政務活動費の使いみちをご覧いただけます
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-mirai-text-muted shrink-0" />
    </Link>
  );
}
