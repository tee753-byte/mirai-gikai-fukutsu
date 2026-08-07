import { Info } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbSchema } from "@/lib/structured-data";
import { siteConfig } from "@/config/site.config";
import { TopicCard } from "@/features/topics/client/components/topic-card";
import { TOPICS } from "@/features/topics/shared/data";

export const metadata: Metadata = {
  title: "トピックス",
  alternates: { canonical: "/topics" },
  description:
    "福津市議会で議論された、暮らしに関わりの大きいテーマをまとめています。",
};

export default function TopicsPage() {
  return (
    <Container className="py-10">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "ホーム", path: "/" },
          { name: "トピックス", path: "/topics" },
        ])}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mirai-text">トピックス</h1>
        <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
          {siteConfig.councilName}
          で議論されたことのうち、暮らしに関わりが大きいと考えられるテーマをまとめています。
        </p>
      </div>

      <div className="mb-8 rounded-lg bg-mirai-surface-grouped px-4 py-3">
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-mirai-text-secondary">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            各テーマは「市の答弁と議決結果にもとづく事実」と「議員が討論で述べた主張」を分けて掲載しています。議員の主張は事実の認定ではありません。賛成・反対の双方を載せ、特定の議員を強調しない形にしています。必ず出典の会議録もあわせてご確認ください。
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {TOPICS.map((topic) => (
          <TopicCard key={topic.slug} topic={topic} />
        ))}
      </div>
    </Container>
  );
}
