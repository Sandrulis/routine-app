import { TeamMemberPage } from "@/app/components/team-member-page";

export default async function TeamMemberRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamMemberPage memberId={id} />;
}
