import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site.config";
import { MemberProfileCard } from "@/features/council-members/client/components/member-profile-card";
import { findMemberProfile } from "@/features/council-members/shared/member-profiles";
import { MINUTES_PUBLICATION_TIMING } from "@/features/council-sessions/shared/minutes-schedule";
import { getQuestionerGroups } from "@/features/general-questions/server/loaders/get-questioner-groups";
import { getTopicThumbnail } from "@/features/general-questions/shared/utils/topic-thumbnail";

type Props = {
  params: Promise<{ slug: string }>;
};

async function findGroup(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);
  const groups = await getQuestionerGroups();
  return groups.find((g) => g.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const group = await findGroup(slug);

  if (!group) {
    return { title: "議員が見つかりません" };
  }

  return {
    title: `${group.name} 議員の一般質問`,
    description: `${siteConfig.councilName} ${group.name}議員が定例会で行った一般質問の一覧です。`,
    // slug は日本語の氏名なのでエンコードする。sitemap.ts と同じ形にそろえる
    alternates: {
      canonical: `/questions/members/${encodeURIComponent(group.slug)}`,
    },
  };
}

export default async function QuestionerDetailPage({ params }: Props) {
  const { slug } = await params;
  const group = await findGroup(slug);

  if (!group) {
    notFound();
  }

  const profile = findMemberProfile(group.name);

  return (
    <Container className="py-8 max-w-2xl">
      <Link
        href="/questions/members"
        className="inline-flex items-center gap-1 text-sm text-mirai-text-secondary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        議員一覧へ
      </Link>

      <div className="mt-4 mb-4">
        <h1 className="text-2xl font-bold text-mirai-text">
          {group.name} 議員
        </h1>
        <p className="mt-1 text-sm text-mirai-text-secondary">
          {/* 名簿に無い場合だけ、一般質問の通告書に書かれていた会派で補う */}
          {profile ? profile.kana : (group.party ?? "会派情報なし")}
        </p>
      </div>

      {profile && (
        <div className="mb-8">
          <MemberProfileCard profile={profile} />
        </div>
      )}

      <h2 className="mb-3 text-lg font-bold text-mirai-text">
        定例会ごとの一般質問
      </h2>

      {group.entries.length === 0 && (
        <p className="text-sm text-mirai-text-secondary">
          {profile?.role === "議長"
            ? "議長は会議の進行役を務めるため、一般質問・総括質疑は行いません。"
            : "掲載している範囲の定例会では、一般質問・総括質疑の実績がまだありません。"}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {group.entries.map((entry) => {
          const thumbnailUrl = getTopicThumbnail(entry.topicTitles);

          return (
            <section
              key={entry.questionId}
              className="overflow-hidden rounded-xl border border-black bg-card"
            >
              <div className="relative h-40 w-full">
                <Image
                  src={thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>

              <div className="p-4">
                {entry.questionType === "sokatsu_shitsugi" && (
                  <p className="text-xs text-mirai-text-muted">総括質疑</p>
                )}
                <h3 className="font-bold text-mirai-text">
                  {entry.sessionName}
                </h3>

                {entry.summary && (
                  <p className="mt-2 text-sm leading-relaxed text-mirai-text">
                    {entry.summary}
                  </p>
                )}

                {entry.topicTitles.length > 0 && (
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
                )}

                {!entry.hasTranscript && (
                  <p className="mt-3 inline-flex items-start gap-1 rounded-md bg-mirai-surface-muted px-2 py-1 text-[11px] leading-relaxed text-mirai-text-secondary">
                    <Clock className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>
                      やり取りの全文は、会議録の公開後に掲載します（
                      {MINUTES_PUBLICATION_TIMING}）。
                    </span>
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/questions/${entry.questionId}`}>
                      {entry.hasTranscript
                        ? "質疑のやり取りを読む"
                        : "質問の内容を見る"}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                  {entry.sessionSlug && (
                    <Link
                      href={`/sessions/${entry.sessionSlug}/questions`}
                      className="text-sm text-mirai-text-secondary hover:underline"
                    >
                      この定例会の一般質問をすべて見る
                    </Link>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </Container>
  );
}
