import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { CommitteeArchiveView } from "@/features/committee-minutes/server/components/committee-archive-view";
import { getCommitteeMeetingsBySlug } from "@/features/committee-minutes/server/loaders/get-committee-meetings-by-slug";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CommitteeArchivePage({ params }: Props) {
  const { slug } = await params;
  const meetings = await getCommitteeMeetingsBySlug(slug);
  if (meetings.length === 0) {
    notFound();
  }

  return (
    <Container className="py-8">
      <CommitteeArchiveView meetings={meetings} />
    </Container>
  );
}
