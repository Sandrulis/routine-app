"use client";

import Link from "next/link";
import { SectionPage } from "@/app/components/section-page";
import { LoadingState } from "@/app/components/loading-state";
import { useTranslations } from "@/app/components/translations-provider";
import { useProjects } from "@/app/lib/projects-store";

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { t } = useTranslations();
  const { projects, isReady } = useProjects();
  const project = projects.find((item) => item.id === projectId) ?? null;

  if (!isReady) {
    return (
      <SectionPage
        title={t("projects.detail.loading", "Ielādē projektu")}
        subtitle={t("projects.page.subtitle", "Aktīvie projekti, kuros komanda šobrīd strādā.")}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  if (!project) {
    return (
      <SectionPage
        title={t("projects.detail.missing", "Projekts nav atrasts")}
        subtitle={t(
          "projects.detail.missing_description",
          "Šis projekts vairs nav pieejams vai ir dzēsts.",
        )}
      >
        <Link
          href="/projects"
          className="inline-flex min-h-10 items-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          {t("projects.back", "Atpakaļ uz projektiem")}
        </Link>
      </SectionPage>
    );
  }

  return (
    <SectionPage
      title={project.name}
      subtitle={
        project.description ||
        t("projects.detail.empty_description", "Šim projektam vēl nav apraksta.")
      }
    >
      <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-6 text-sm text-zinc-500">
        {t(
          "projects.detail.placeholder",
          "Projekta saturu šeit pielāgosi nākamajā solī.",
        )}
      </div>
    </SectionPage>
  );
}
