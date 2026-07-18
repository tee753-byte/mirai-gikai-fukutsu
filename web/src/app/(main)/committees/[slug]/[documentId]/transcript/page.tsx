import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { TranscriptView } from "@/features/committee-minutes/server/components/transcript-view";
import { getCommitteeMeeting } from "@/features/committee-minutes/server/loaders/get-committee-meeting";

type Props = {
  params: Promise<{ slug: string; documentId: string }>;
};

export default async function CommitteeTranscriptPage({ params }: Props) {
  const { documentId } = await params;
  const documentIdNumber = Number(documentId);
  if (!Number.isInteger(documentIdNumber)) {
    notFound();
  }

  const meeting = await getCommitteeMeeting(documentIdNumber);
  if (!meeting) {
    notFound();
  }

  return (
    <Container className="py-8">
      <TranscriptView meeting={meeting} />
    </Container>
  );
}
