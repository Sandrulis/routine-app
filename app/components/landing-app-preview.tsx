"use client";

import { useTranslations } from "@/app/components/translations-provider";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";

function MiniAvatar({
  initials,
  toneClassName,
  online = false,
}: {
  initials: string;
  toneClassName: string;
  online?: boolean;
}) {
  return (
    <span className="relative inline-flex">
      <span
        className={`inline-flex size-5 items-center justify-center rounded-full text-[9px] font-semibold ${toneClassName}`}
      >
        {initials}
      </span>
      {online ? (
        <span className="landing-online-dot absolute -right-0.5 -bottom-0.5 size-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      ) : null}
    </span>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: "todo" | "in_progress" | "done";
  label: string;
}) {
  const tone =
    status === "done"
      ? "bg-emerald-500"
      : status === "in_progress"
        ? "bg-orange-500"
        : "bg-zinc-400";

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold text-white ${tone}`}
    >
      {label}
    </span>
  );
}

function TaskCard({
  title,
  initials,
  toneClassName,
  status,
  statusLabel,
  lifted = false,
}: {
  title: string;
  initials: string;
  toneClassName: string;
  status: "todo" | "in_progress" | "done";
  statusLabel: string;
  lifted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white px-2.5 py-2 shadow-sm ${
        lifted ? "landing-preview-card-lift shadow-md ring-2 ring-blue-100" : ""
      }`}
    >
      <p className="truncate text-[11px] font-medium text-zinc-900">{title}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <MiniAvatar initials={initials} toneClassName={toneClassName} />
        <StatusPill status={status} label={statusLabel} />
      </div>
    </div>
  );
}

export function LandingAppPreview() {
  const { t } = useTranslations();
  const { isEnabled } = useFrontendModules();
  const todo = t("todo.columns.todo", "Darāms");
  const progress = t("todo.columns.in_progress", "Procesā");
  const done = t("todo.columns.done", "Gatavs");
  const showTemplates = isEnabled(FRONTEND_MODULE_KEYS.templates);
  const showFiles = isEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const showChecklist = isEnabled(FRONTEND_MODULE_KEYS.checklist);

  return (
    <div className="landing-preview-frame relative" aria-hidden="true">
      <div className="overflow-hidden rounded-4xl border border-zinc-200/80 bg-white shadow-[0_40px_90px_-24px_rgba(16,24,40,0.35),0_8px_24px_-12px_rgba(16,185,129,0.25)] ring-1 ring-zinc-900/5">
        <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2">
          <span className="size-2 rounded-full bg-zinc-300" />
          <span className="size-2 rounded-full bg-zinc-300" />
          <span className="size-2 rounded-full bg-zinc-300" />
          <span className="ml-2 text-[11px] font-medium text-zinc-400">
            {t("app.name", "{SYSTEM_NAME}")}
          </span>
        </div>

        <div className="flex min-h-[320px] bg-zinc-100">
          <aside className="hidden w-[148px] shrink-0 border-r border-zinc-200 bg-white p-2 sm:block">
            <div className="mb-2 flex items-center gap-2 rounded-md px-1.5 py-1.5">
              <span className="inline-flex size-5 items-center justify-center rounded-[2.5px] bg-zinc-900 text-[9px] font-semibold text-white">
                S
              </span>
              <span className="truncate text-[11px] font-medium text-zinc-800">
                {t("landing.preview.team", "Studio")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-zinc-100 px-1.5 py-1 text-[11px] font-medium text-zinc-900">
              <i className="fas fa-house w-3.5 text-center text-[10px] text-zinc-500" />
              {t("nav.home", "Sākums")}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-zinc-600">
              <span className="inline-flex size-4 items-center justify-center rounded-[2.5px] bg-zinc-100 text-[9px] text-zinc-600">
                <i className="fas fa-list-ul" />
              </span>
              {t("nav.lists", "Saraksts")}
            </div>
            <div className="mt-0.5 ml-5 flex items-center gap-1.5 px-1 py-0.5 text-[11px] text-zinc-600">
              <span className="inline-flex size-4 items-center justify-center rounded-[2.5px] bg-blue-500 text-[8px] text-white">
                <i className="fas fa-briefcase" />
              </span>
              {t("landing.preview.list_projects", "Projekti")}
            </div>
            <div className="mt-0.5 ml-5 flex items-center gap-1.5 px-1 py-0.5 text-[11px] text-zinc-600">
              <span className="inline-flex size-4 items-center justify-center rounded-[2.5px] bg-emerald-500 text-[8px] text-white">
                <i className="fas fa-users" />
              </span>
              {t("landing.preview.list_clients", "Klienti")}
            </div>
            {showFiles ? (
              <div className="mt-0.5 ml-9 flex items-center gap-1.5 px-1 py-0.5 text-[11px] text-zinc-500">
                <span className="inline-flex size-4 items-center justify-center rounded-[2.5px] bg-zinc-100 text-[8px] text-zinc-600">
                  <i className="fas fa-file" />
                </span>
                {t("landing.preview.file_brief", "Brīfs.pdf")}
              </div>
            ) : null}
            {showTemplates ? (
              <div className="mt-0.5 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-zinc-600">
                <span className="inline-flex size-4 items-center justify-center rounded-[2.5px] bg-zinc-100 text-[9px] text-zinc-600">
                  <i className="fas fa-copy" />
                </span>
                {t("nav.templates", "Šabloni")}
              </div>
            ) : null}
            <div className="mt-0.5 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-zinc-600">
              <span className="inline-flex size-4 items-center justify-center rounded-[2.5px] bg-violet-100 text-[9px] text-violet-700">
                <i className="fas fa-users" />
              </span>
              {t("nav.team", "Komanda")}
            </div>
            <div className="mt-1 space-y-1 pl-6">
              <div className="flex items-center gap-1.5">
                <MiniAvatar
                  initials="AK"
                  toneClassName="bg-sky-100 text-sky-800"
                  online
                />
                <span className="truncate text-[10px] text-zinc-600">
                  {t("landing.preview.member_anna", "Anna")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MiniAvatar
                  initials="JB"
                  toneClassName="bg-emerald-100 text-emerald-800"
                />
                <span className="truncate text-[10px] text-zinc-600">
                  {t("landing.preview.member_janis", "Jānis")}
                </span>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-900">
              <i className="fas fa-house text-[10px] text-zinc-400" />
              {t("nav.home", "Sākums")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
                  {todo}
                </p>
                <TaskCard
                  title={t("landing.preview.task_brief", "Klientu atsauksmes")}
                  initials="JB"
                  toneClassName="bg-emerald-100 text-emerald-800"
                  status="todo"
                  statusLabel={todo}
                />
                <TaskCard
                  title={t("landing.preview.task_contract", "Līguma projekts")}
                  initials="AK"
                  toneClassName="bg-sky-100 text-sky-800"
                  status="todo"
                  statusLabel={todo}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
                  {progress}
                </p>
                <TaskCard
                  title={t(
                    "landing.preview.task_prototype",
                    "Mājaslapas prototips",
                  )}
                  initials="AK"
                  toneClassName="bg-sky-100 text-sky-800"
                  status="in_progress"
                  statusLabel={progress}
                  lifted
                />
                <TaskCard
                  title={t("landing.preview.task_sprint", "Sprinta plāns")}
                  initials="JB"
                  toneClassName="bg-emerald-100 text-emerald-800"
                  status="in_progress"
                  statusLabel={progress}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
                  {done}
                </p>
                <TaskCard
                  title={t("landing.preview.task_kickoff", "Kick-off tikšanās")}
                  initials="AK"
                  toneClassName="bg-sky-100 text-sky-800"
                  status="done"
                  statusLabel={done}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-preview-float absolute -right-3 -bottom-6 hidden w-52 rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_16px_40px_rgba(24,24,27,0.12)] sm:block">
        <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
          {showChecklist
            ? t("subtasks.checklist.title", "Check List")
            : t("landing.preview.subtasks", "Apakšuzdevumi")}
        </p>
        <p className="mt-1 truncate text-[12px] font-semibold text-zinc-900">
          {t("landing.preview.task_prototype", "Mājaslapas prototips")}
        </p>
        <div className="mt-2 space-y-1.5">
          {showChecklist ? (
            <>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                <i className="far fa-square text-[10px] text-zinc-400" aria-hidden="true" />
                <span className="truncate">
                  {t("landing.preview.checklist_wireframes", "Maketi")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                <i className="fas fa-square-check text-[10px] text-emerald-500" aria-hidden="true" />
                <span className="truncate">
                  {t("landing.preview.checklist_copy", "Tekstu uzmetums")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                <i className="far fa-square text-[10px] text-zinc-400" aria-hidden="true" />
                <span className="truncate">
                  {t("landing.preview.checklist_review", "Atsauksmes")}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-zinc-600">
                  {t("landing.preview.subtask_design", "Dizaina sistēma")}
                </span>
                <StatusPill status="in_progress" label={progress} />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-zinc-600">
                  {t("landing.preview.subtask_hero", "Hero bloks")}
                </span>
                <StatusPill status="todo" label={todo} />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-zinc-600">
                  {t("landing.preview.subtask_copy", "Tekstu uzmetums")}
                </span>
                <StatusPill status="done" label={done} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
