import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";

export function CommitteeBanner() {
  return (
    <Link
      href="/committees"
      className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start gap-3">
        <Users className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-mirai-text">委員会</p>
          <p className="mt-0.5 text-sm text-mirai-text-secondary">
            各委員会でどんな議論があったかを分かりやすくまとめています
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-mirai-text-muted shrink-0" />
    </Link>
  );
}
