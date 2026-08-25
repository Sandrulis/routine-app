import type { Metadata } from "next";
import { TeamMemberPage } from "@/app/components/team-member-page";
import { fetchTeamMemberName } from "@/app/lib/document-title-server";
import { resolvedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const name = await fetchTeamMemberName(id);
  return resolvedPageMetadata(name, "team.detail.missing", "Lietotājs nav atrasts");
}

export default async function TeamMemberRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamMemberPage memberId={id} />;
}
