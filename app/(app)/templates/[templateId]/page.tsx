import type { Metadata } from "next";
import { TemplateDetailPage } from "@/app/components/template-detail-page";
import { fetchWorkTemplateName } from "@/app/lib/document-title-server";
import { requireFrontendModule } from "@/app/lib/frontend-modules/access";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { resolvedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  const name = await fetchWorkTemplateName(templateId);
  return resolvedPageMetadata(name, "templates.detail.missing", "Šablons nav atrasts");
}

export default async function TemplateDetailRoute({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  await requireFrontendModule(FRONTEND_MODULE_KEYS.templates);
  const { templateId } = await params;
  return <TemplateDetailPage templateId={templateId} />;
}
