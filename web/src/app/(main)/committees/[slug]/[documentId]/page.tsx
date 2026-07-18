import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { MeetingDetailView } from "@/features/committee-minutes/server/components/meeting-detail-view";
import { getCommitteeMeeting } from "@/features/committee-minutes/server/loaders/get-committee-meeting";

type Props = {
  params: Promise<{ slug: string; documentId: string }>;
};

export default async function CommitteeMeetingPage({ params }: Props) {
  const { slug, documentId } = await params;
  const documentIdNumber = Number(documentId);
  if (!Number.isInteger(documentIdNumber)) {
    notFound();
  }

  const meeting = await getCommitteeMeeting(documentIdNumber);
  if (!meeting || meeting.committeeSlug !== slug) {
    notFound();
  }

  return (
    <Container className="py-8">
      <MeetingDetailView meeting={meeting} />
    </Container>
  );
}
