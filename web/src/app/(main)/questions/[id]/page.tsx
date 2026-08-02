import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { QuestionDetailView } from "@/features/general-questions/client/components/question-detail-view";
import { getGeneralQuestionById } from "@/features/general-questions/server/loaders/get-general-question-by-id";
import { toQuestionerSlug } from "@/features/general-questions/shared/utils/build-questioner-groups";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const question = await getGeneralQuestionById(id);

  if (!question) {
    return { title: "質問が見つかりません" };
  }

  // 同じ議員が複数の定例会で質問しているため、定例会名を入れないと
  // 検索結果でもタブでも同じ見出しが並んで区別できなくなる
  const sessionPrefix = question.session_name
    ? `${question.session_name} `
    : "";

  return {
    title: `${sessionPrefix}${question.questioner_name} 議員の一般質問 | ${siteConfig.siteName}`,
    description: question.summary ?? undefined,
  };
}

const DAY_LABELS: Record<number, string> = {
  1: "第1日",
  2: "第2日",
  3: "第3日",
  4: "第4日",
  5: "第5日",
  6: "第6日",
};

export default async function GeneralQuestionDetailPage({ params }: Props) {
  const { id } = await params;
  const question = await getGeneralQuestionById(id);

  if (!question) {
    notFound();
  }

  const dayLabel =
    DAY_LABELS[question.session_day] ?? `第${question.session_day}日`;

  return (
    <Container className="py-8 max-w-2xl">
      <Link
        href={`/questions/members/${encodeURIComponent(toQuestionerSlug(question.questioner_name))}`}
        className="inline-flex items-center gap-1 text-sm text-mirai-text-secondary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {question.questioner_name} 議員の一覧に戻る
      </Link>

      <div className="mt-4 mb-6">
        {/* 議員ページの見出しと同じだとどちらのページか分からないため「の一般質問」まで書く */}
        <h1 className="text-2xl font-bold text-mirai-text">
          {question.questioner_name} 議員の一般質問
        </h1>
        <p className="mt-1 text-sm text-mirai-text-secondary">
          {question.session_name && <span>{question.session_name}　｜　</span>}
          {question.questioner_party && (
            <span>{question.questioner_party}　｜　</span>
          )}
          {dayLabel}
        </p>
      </div>

      {question.summary && (
        <p className="mb-6 text-mirai-text leading-relaxed">
          {question.summary}
        </p>
      )}

      <QuestionDetailView
        topics={question.topics}
        rawText={question.raw_text}
      />

      <p className="mt-6 text-xs leading-relaxed text-mirai-text-secondary">
        要約はAIを活用して作成し、公式会議録と照合しています。正確な内容は必ず原文または公式会議録をご確認ください。
      </p>

      {question.source_url && (
        <div className="mt-8 pt-6 border-t border-border">
          <Link
            href={question.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            公式会議録を見る
          </Link>
        </div>
      )}
    </Container>
  );
}
