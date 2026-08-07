import { ArrowRight, Clock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getTopicThumbnail } from "@/features/general-questions/shared/utils/topic-thumbnail";

// 本番DBの山本祐平議員の公開済みデータをそのまま使用（2026-08-07時点のスナップショット）。
// プロトタイプ確認用のため、他の議員に展開する際はDBから動的に取得する形に直す。
const ENTRIES = [
  {
    sessionName: "令和7年 12月定例会",
    summary:
      "情報公開及び議事録の取り扱いと、本市のいじめ対応について質問しました。",
    topicTitles: ["情報公開及び議事録について", "本市のいじめ対応について"],
    hasTranscript: true,
  },
  {
    sessionName: "令和8年 6月定例会",
    summary:
      "学校給食におけるアレルギー等の対応と、いじめを中心とした社会課題への対応について質問しました。",
    topicTitles: [
      "学校給食におけるアレルギー等の対応について",
      "いじめを中心とした社会課題への対応について",
    ],
    hasTranscript: false,
  },
  {
    sessionName: "令和8年 3月定例会",
    summary: "市の財政状況と、市長が示した市政方針について質問しました。",
    topicTitles: ["本市の財政状況及び市政運営について"],
    hasTranscript: true,
  },
];

function SessionCard({ entry }: { entry: (typeof ENTRIES)[number] }) {
  const thumbnailUrl = getTopicThumbnail(entry.topicTitles);

  return (
    <section className="rounded-xl border border-black bg-card overflow-hidden">
      {thumbnailUrl && (
        <div className="relative w-full h-40">
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-bold text-mirai-text">{entry.sessionName}</h3>

        <p className="mt-2 text-sm leading-relaxed text-mirai-text">
          {entry.summary}
        </p>

        <ul className="mt-3 flex flex-col gap-1">
          {entry.topicTitles.map((title) => (
            <li
              key={title}
              className="text-sm text-mirai-text-secondary before:mr-2 before:content-['・']"
            >
              {title}
            </li>
          ))}
        </ul>

        {!entry.hasTranscript && (
          <p className="mt-3 inline-flex items-start gap-1 rounded-md bg-mirai-surface-muted px-2 py-1 text-[11px] leading-relaxed text-mirai-text-secondary">
            <Clock className="mt-0.5 h-3 w-3 shrink-0" />
            <span>やり取りの全文は、会議録の公開後に掲載します。</span>
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button variant="outline" size="sm">
            {entry.hasTranscript ? "質疑のやり取りを読む" : "質問の内容を見る"}
            <ArrowRight className="h-3 w-3" />
          </Button>
          <span className="text-sm text-mirai-text-secondary">
            この定例会の一般質問をすべて見る
          </span>
        </div>
      </div>
    </section>
  );
}

export default function CardBannerPrototypePage() {
  return (
    <div>
      <p className="text-xs font-medium text-mirai-text-secondary mb-1">
        議員ページ：一般質問カードにバナー画像（案）
      </p>
      <h1 className="text-2xl font-bold text-mirai-text mb-1">山本祐平 議員</h1>
      <p className="text-sm text-mirai-text-secondary mb-6">
        個別キーワード→大分類キーワード→デフォルト画像の2段構え（画像なしは作らない方針）。
        産業・地域振興の大分類だけ、ふさわしい画像が見つかるまで町並み写真を仮置き中。
      </p>

      <div className="flex flex-col gap-4 max-w-2xl">
        {ENTRIES.map((entry) => (
          <SessionCard key={entry.sessionName} entry={entry} />
        ))}
      </div>
    </div>
  );
}
