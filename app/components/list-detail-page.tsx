"use client";

import Link from "next/link";
import { useState } from "react";
import { ListWindowsBoard } from "@/app/components/list-windows-board";
import { createMenuAnchorFromEvent } from "@/app/components/create-item-menu";
import { ParentCreateFlow, type ParentCreateContext } from "@/app/components/parent-create-flow";
import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";
import { useLists } from "@/app/lib/lists-store";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  listAccessCapabilities,
  resolveListAccessLevel,
} from "@/app/lib/list-access";

export function ListDetailPage({ listId }: { listId: string }) {
  const { t } = useTranslations();
  const { lists, listTasks, isReady } = useLists();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const [parentCreate, setParentCreate] = useState<ParentCreateContext | null>(
    null,
  );
  const list = lists.find((item) => item.id === listId) ?? null;
  const tasks = listTasks(listId);
  const listAccess = list
    ? listAccessCapabilities(
        resolveListAccessLevel(list, currentUser, roles, isAdmin),
      )
    : listAccessCapabilities(null);

  if (!isReady) {
    return (
      <SectionPage
        title={t("lists.detail.loading", "Ielādē sarakstu")}
        subtitle={t("lists.page.subtitle", "Saraksti ar uzdevumiem.")}
      >
        <div className="h-32 rounded-3xl border border-zinc-200 bg-white" />
      </SectionPage>
    );
  }

  if (!list) {
    return (
      <SectionPage
        title={t("lists.detail.missing", "Saraksts nav atrasts")}
        subtitle={t(
          "lists.detail.missing_description",
          "Šis saraksts vairs nav pieejams.",
        )}
      >
        <Link
          href="/lists"
          className="inline-flex min-h-10 items-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          {t("nav.home", "Sākums")}
        </Link>
      </SectionPage>
    );
  }

  return (
    <SectionPage
      title={
        <span className="inline-flex items-center gap-2">
          <span>{list.name}</span>
          {list.isPrivate ? (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-amber-400 px-1.5 text-[11px] text-zinc-900"
              title={t("lists.private.label", "Privāts saraksts")}
            >
              <i className="fas fa-user-lock" aria-hidden="true" />
            </span>
          ) : null}
        </span>
      }
      subtitle={
        list.description ||
        t("lists.detail.empty_description", "Šim sarakstam vēl nav apraksta.")
      }
      actions={
        listAccess.canCreateTasks ? (
        <button
          type="button"
          onClick={(event) =>
            setParentCreate({
              listId: list.id,
              parentId: null,
              variant: list.kind === "folder" ? "folder" : "list",
              anchor: createMenuAnchorFromEvent(event),
            })
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("create.menu.title", "Izveidot")}
        </button>
        ) : undefined
      }
    >
      <ListWindowsBoard listId={list.id} tasks={tasks} />

      <ParentCreateFlow
        context={parentCreate}
        onClose={() => setParentCreate(null)}
      />
    </SectionPage>
  );
}
