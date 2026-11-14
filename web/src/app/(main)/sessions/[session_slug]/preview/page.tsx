import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { SessionPreviewContent } from "@/features/council-sessions/server/components/session-preview-content";
import { getSessionPreviewData } from "@/features/council-sessions/server/data/session-preview-data";
import { getCouncilSessionBySlug } from "@/features/council-sessions/server/loaders/get-council-session-by-slug";
import { isSessionOpen } from "@/features/council-sessions/shared/utils/is-session-open";
import { getJapanTime, toISODate } from "@/lib/utils/date";

type Props = {
  params: Promise<{ session_slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { session_slug } = await params;
  const session = await getCouncilSessionBySlug(session_slug);
  const preview = getSessionPreviewData(session_slug);

  if (!session || !preview) {
    return { title: "定例会が見つかりません" };
  }

  const open = isSessionOpen(session, toISODate(getJapanTime()));

  return {
    title: open ? `${session.name}の予告` : `${session.name}の開催記録`,
    description: preview.lead,
    alternates: { canonical: `/sessions/${session_slug}/preview` },
  };
}

export default async function SessionPreviewPage({ params }: Props) {
  const { session_slug } = await params;
  const [session, preview] = await Promise.all([
    getCouncilSessionBySlug(session_slug),
    Promise.resolve(getSessionPreviewData(session_slug)),
  ]);

  if (!session || !preview) {
    notFound();
  }

  return (
    <Container className="py-8">
      <SessionPreviewContent
        session={session}
        preview={preview}
        headingLevel="h1"
        isOpen={isSessionOpen(session, toISODate(getJapanTime()))}
      />
    </Container>
  );
}
