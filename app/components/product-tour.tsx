"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";
import {
  getOverlayPortalRoot,
  lockBodyOverflow,
  unlockBodyOverflow,
} from "@/app/lib/dom/overlay-root";
import { setProductTourCompletedAction } from "@/app/lib/users/actions";

/** Value of the `data-tour` attribute a step points at. */
type TourTarget =
  | "home"
  | "lists"
  | "lists:toggle"
  | "lists:add"
  | "list-item"
  | "list-item:add"
  | "list-item:more"
  | "task"
  | "task:add"
  | "task:more"
  | "subtask"
  | "team"
  | "team:toggle"
  | "team:add"
  | "team:more"
  | "user-menu";

/** One entry of the menu that opens from the highlighted button. */
type TourOption = {
  icon: string;
  label: string;
  hint: string;
};

type TourStep = {
  id: string;
  /** Null renders a centred card instead of a spotlight. */
  target: TourTarget | null;
  /** Used when the row itself is missing, e.g. before the first list exists. */
  fallback?: TourTarget;
  title: string;
  text: string;
  options?: TourOption[];
};

type SpotlightRect = { top: number; left: number; width: number; height: number };

type TourLayout = {
  rect: SpotlightRect | null;
  popoverTop: number;
  popoverLeft: number;
};

const SPOTLIGHT_PADDING = 6;
const POPOVER_WIDTH = 320;
const POPOVER_GAP = 16;
const VIEWPORT_PADDING = 12;
/** Sidebar rows only mount once lists finish loading. */
const AUTOSTART_POLL_MS = 400;
const AUTOSTART_ATTEMPTS = 20;
const DESKTOP_MIN_WIDTH = 1280;

function findTarget(target: TourTarget | null): HTMLElement | null {
  if (!target) return null;
  const node = document.querySelector(`[data-tour="${target}"]`);
  if (!(node instanceof HTMLElement)) return null;
  if (node.offsetWidth === 0 && node.offsetHeight === 0) return null;
  return node;
}

function findStepAnchor(step: TourStep): HTMLElement | null {
  return findTarget(step.target) ?? findTarget(step.fallback ?? null);
}

function measure(element: HTMLElement | null, popoverHeight: number): TourLayout {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (!element) {
    return {
      rect: null,
      popoverTop: Math.max(VIEWPORT_PADDING, (viewportHeight - popoverHeight) / 2),
      popoverLeft: Math.max(VIEWPORT_PADDING, (viewportWidth - POPOVER_WIDTH) / 2),
    };
  }

  const bounds = element.getBoundingClientRect();
  const rect: SpotlightRect = {
    top: bounds.top - SPOTLIGHT_PADDING,
    left: bounds.left - SPOTLIGHT_PADDING,
    width: bounds.width + SPOTLIGHT_PADDING * 2,
    height: bounds.height + SPOTLIGHT_PADDING * 2,
  };

  const spaceRight = viewportWidth - (rect.left + rect.width);
  const fitsRight = spaceRight >= POPOVER_WIDTH + POPOVER_GAP + VIEWPORT_PADDING;

  const popoverLeft = fitsRight
    ? rect.left + rect.width + POPOVER_GAP
    : Math.min(
        Math.max(VIEWPORT_PADDING, rect.left),
        Math.max(VIEWPORT_PADDING, viewportWidth - POPOVER_WIDTH - VIEWPORT_PADDING),
      );

  const preferredTop = fitsRight
    ? rect.top + rect.height / 2 - popoverHeight / 2
    : rect.top + rect.height + POPOVER_GAP;

  const maxTop = Math.max(VIEWPORT_PADDING, viewportHeight - popoverHeight - VIEWPORT_PADDING);
  const popoverTop =
    !fitsRight && preferredTop > maxTop
      ? Math.max(VIEWPORT_PADDING, rect.top - POPOVER_GAP - popoverHeight)
      : Math.min(Math.max(VIEWPORT_PADDING, preferredTop), maxTop);

  return { rect, popoverTop, popoverLeft };
}

function sameLayout(a: TourLayout, b: TourLayout) {
  if (Math.round(a.popoverTop) !== Math.round(b.popoverTop)) return false;
  if (Math.round(a.popoverLeft) !== Math.round(b.popoverLeft)) return false;
  if (!a.rect || !b.rect) return a.rect === b.rect;
  return (
    Math.round(a.rect.top) === Math.round(b.rect.top) &&
    Math.round(a.rect.left) === Math.round(b.rect.left) &&
    Math.round(a.rect.width) === Math.round(b.rect.width) &&
    Math.round(a.rect.height) === Math.round(b.rect.height)
  );
}

const ProductTourContext = createContext<{ startTour: () => void } | null>(null);

export function useProductTour() {
  const context = useContext(ProductTourContext);
  if (!context) {
    throw new Error("useProductTour must be used inside ProductTourProvider");
  }
  return context;
}

export function ProductTourProvider({
  children,
  completed = true,
}: {
  children: ReactNode;
  completed?: boolean;
}) {
  const { t } = useTranslations();
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(completed);

  const allSteps = useMemo<TourStep[]>(
    () => [
      {
        id: "welcome",
        target: null,
        title: t("tour.welcome.title", "Iepazīsti {SYSTEM_NAME}"),
        text: t(
          "tour.welcome.text",
          "Izejam cauri sānjoslai un parādām, ko dara katra poga un kādas opcijas slēpjas zem tās. Vari pārtraukt jebkurā brīdī.",
        ),
      },
      {
        id: "home",
        target: "home",
        title: t("tour.home.title", "Sākums"),
        text: t(
          "tour.home.text",
          "Šeit redzi savu dienas kopsavilkumu: tuvākos termiņus un uzdevumus, kas gaida tavu darbu.",
        ),
      },
      {
        id: "lists",
        target: "lists",
        title: t("tour.lists.title", "Saraksti"),
        text: t(
          "tour.lists.text",
          "Saraksti ir vieta, kur glabājas viss darbs. Uzbraucot ar peli, rindas labajā malā parādās vairākas pogas.",
        ),
      },
      {
        id: "lists-toggle",
        target: "lists:toggle",
        fallback: "lists",
        title: t("tour.toggle.title", "Izvērst un sakļaut"),
        text: t(
          "tour.lists_toggle.text",
          "Bultiņa izver visus tavus sarakstus tepat sānjoslā, neatverot atsevišķu lapu.",
        ),
      },
      {
        id: "lists-add",
        target: "lists:add",
        fallback: "lists",
        title: t("tour.lists_add.title", "Jauns saraksts"),
        text: t(
          "tour.lists_add.text",
          "Plusa poga parādās, kad ar peli pārvieto pār rindu, un atver jauna saraksta formu.",
        ),
        options: [
          {
            icon: "fas fa-font",
            label: t("lists.fields.name", "Nosaukums"),
            hint: t("tour.option.list_name_hint", "Piemēram, projekts, klients vai joma."),
          },
          {
            icon: "fas fa-palette",
            label: t("lists.fields.icon", "Ikona"),
            hint: t("tour.option.list_icon_hint", "Ikona un krāsa, lai sarakstu ātri atpazītu."),
          },
          {
            icon: "fas fa-lock",
            label: t("lists.private.label", "Privāts saraksts"),
            hint: t("tour.option.list_private_hint", "Privātu sarakstu redzi tikai tu."),
          },
        ],
      },
      {
        id: "list-item",
        target: "list-item",
        fallback: "lists",
        title: t("tour.list_item.title", "Tavs saraksts"),
        text: t(
          "tour.list_item.text",
          "Atver sarakstu, lai redzētu visus tā uzdevumus. Ar bultiņu izver saturu tepat sānjoslā.",
        ),
      },
      {
        id: "list-item-add",
        target: "list-item:add",
        fallback: "lists",
        title: t("create.menu.title", "Izveidot"),
        text: t(
          "tour.list_item_add.text",
          "Plusa poga uz saraksta atver izvēlni ar visu, ko sarakstā var pievienot.",
        ),
        options: [
          {
            icon: "far fa-folder",
            label: t("create.folder.title", "Mape"),
            hint: t(
              "create.folder.description",
              "Grupē sarakstus, dokumentus un vairāk",
            ),
          },
          {
            icon: "fas fa-list-check",
            label: t("create.task_list.title", "Uzdevumu saraksts"),
            hint: t(
              "create.task_list.description",
              "Darāmais darbs ar statusu, termiņu un apakšuzdevumiem",
            ),
          },
          {
            icon: "fas fa-layer-group",
            label: t("templates.apply.title", "Pievienot šablonu"),
            hint: t(
              "templates.apply.description",
              "Ievieto sagatavotus uzdevumu sarakstus šajā mapē",
            ),
          },
          {
            icon: "fas fa-arrow-up-from-bracket",
            label: t("create.file.upload_title", "Augšupielādēt failu"),
            hint: t("create.file.upload_description", "Pievieno dokumentu šim sarakstam"),
          },
        ],
      },
      {
        id: "list-item-more",
        target: "list-item:more",
        fallback: "lists",
        title: t("tour.list_more.title", "Saraksta darbības"),
        text: t(
          "tour.list_more.text",
          "Trīs punktu poga blakus plusam atver saraksta iestatījumus.",
        ),
        options: [
          {
            icon: "fas fa-pen",
            label: t("actions.edit", "Labot"),
            hint: t("tour.option.edit_hint", "Maini nosaukumu, aprakstu un iestatījumus."),
          },
          {
            icon: "fas fa-circle-half-stroke",
            label: t("lists.statuses.title", "Statusi"),
            hint: t(
              "lists.statuses.menu_description",
              "Sistēmas un saraksta statusi",
            ),
          },
          {
            icon: "fas fa-bolt",
            label: t("lists.automations.title", "Automatizācijas"),
            hint: t(
              "lists.automations.menu_description",
              "Automātiskās darbības sarakstā",
            ),
          },
          {
            icon: "fas fa-trash",
            label: t("actions.delete", "Dzēst"),
            hint: t("tour.option.delete_hint", "Neatgriezeniski noņem ierakstu."),
          },
        ],
      },
      {
        id: "task",
        target: "task",
        fallback: "lists",
        title: t("tour.task.title", "Uzdevums"),
        text: t(
          "tour.task.text",
          "Uzdevums ir viens darāmais. Tam var pievienot aprakstu, termiņu, atbildīgo un failus.",
        ),
      },
      {
        id: "task-add",
        target: "task:add",
        fallback: "lists",
        title: t("tour.task_add.title", "Jauns apakšuzdevums"),
        text: t(
          "tour.task_add.text",
          "Šī poga sadala uzdevumu mazākos soļos. Katram apakšuzdevumam ir savs statuss un izpildītājs.",
        ),
      },
      {
        id: "task-more",
        target: "task:more",
        fallback: "lists",
        title: t("tour.task_more.title", "Uzdevuma darbības"),
        text: t(
          "tour.task_more.text",
          "Tā pati trīs punktu poga uz uzdevuma piedāvā citas darbības.",
        ),
        options: [
          {
            icon: "fas fa-pen",
            label: t("actions.edit", "Labot"),
            hint: t("tour.option.edit_hint", "Maini nosaukumu, aprakstu un iestatījumus."),
          },
          {
            icon: "fas fa-circle-half-stroke",
            label: t("tasks.statuses.title", "Statusi"),
            hint: t(
              "tasks.statuses.menu_description",
              "Uzdevuma apakšuzdevumu statusi",
            ),
          },
          {
            icon: "fas fa-box-archive",
            label: t("actions.archive", "Arhivēt"),
            hint: t("tour.option.archive_hint", "Paslēpj pabeigto, saglabājot vēsturi."),
          },
          {
            icon: "fas fa-trash",
            label: t("actions.delete", "Dzēst"),
            hint: t("tour.option.delete_hint", "Neatgriezeniski noņem ierakstu."),
          },
        ],
      },
      {
        id: "subtask",
        target: "subtask",
        fallback: "lists",
        title: t("tour.subtask.title", "Apakšuzdevums"),
        text: t(
          "tour.subtask.text",
          "Klikšķini uz krāsainā apļa, lai ātri nomainītu statusu, vai uz nosaukuma, lai atvērtu detaļas.",
        ),
        options: [
          {
            icon: "fas fa-circle-half-stroke",
            label: t("subtasks.table.status", "Statuss"),
            hint: t(
              "tour.option.subtask_status_hint",
              "Darāms, procesā, gatavs un citi saraksta statusi.",
            ),
          },
          {
            icon: "fas fa-align-left",
            label: t("subtasks.modal.details", "Detaļas"),
            hint: t(
              "tour.option.subtask_details_hint",
              "Apraksts, termiņš, atbildīgais, kontrolsaraksts un pielikumi.",
            ),
          },
          {
            icon: "fas fa-clock-rotate-left",
            label: t("subtasks.modal.history", "Vēsture"),
            hint: t(
              "tour.option.subtask_history_hint",
              "Kas un kad ko mainīja šajā apakšuzdevumā.",
            ),
          },
        ],
      },
      {
        id: "team",
        target: "team",
        title: t("tour.team.title", "Komanda"),
        text: t(
          "tour.team.text",
          "Šeit redzi komandas lietotājus un to, kurš ir tiešsaistē. Arī šai rindai labajā malā ir vairākas pogas.",
        ),
      },
      {
        id: "team-toggle",
        target: "team:toggle",
        fallback: "team",
        title: t("tour.toggle.title", "Izvērst un sakļaut"),
        text: t(
          "tour.team_toggle.text",
          "Tā pati bultiņa uz komandas rindas parāda vai paslēpj komandas lietotāju sarakstu.",
        ),
      },
      {
        id: "team-add",
        target: "team:add",
        fallback: "team",
        title: t("tour.team_add.title", "Uzaicini lietotāju"),
        text: t(
          "tour.team_add.text",
          "Nosūti uzaicinājumu uz e-pastu. Lietotājs pievienojas komandai un uzreiz redz kopīgos sarakstus.",
        ),
      },
      {
        id: "team-more",
        target: "team:more",
        fallback: "team",
        title: t("tour.team_more.title", "Komandas iestatījumi"),
        text: t(
          "tour.team_more.text",
          "Zem trīs punktiem ir komandas pārvaldība un mākoņa integrācijas.",
        ),
        options: [
          {
            icon: "fas fa-user-shield",
            label: t("team.roles.title", "Komandas lomas"),
            hint: t("team.roles.menu_description", "Sadali lietotājus pa lomām"),
          },
          {
            icon: "fas fa-layer-group",
            label: t("nav.templates", "Šabloni"),
            hint: t(
              "templates.menu_description",
              "Sagatavo uzdevumu sarakstus, ko pēc tam pievieno mapē",
            ),
          },
          {
            icon: "fas fa-cloud",
            label: t("nav.google_drive", "Google Drive Integrācija"),
            hint: t(
              "google_drive.menu_description",
              "Sūti augšupielādētos failus uz komandas Google Drive",
            ),
          },
          {
            icon: "fas fa-cloud",
            label: t("nav.onedrive", "OneDrive Integrācija"),
            hint: t(
              "onedrive.menu_description",
              "Sūti augšupielādētos failus uz komandas OneDrive",
            ),
          },
        ],
      },
      {
        id: "user-menu",
        target: "user-menu",
        title: t("tour.user_menu.title", "Tavs profils"),
        text: t(
          "tour.user_menu.text",
          "Zem sava vārda atrodi uzstādījumus, paziņojumus un pogu, ar ko šo pamācību palaist vēlreiz.",
        ),
        options: [
          {
            icon: "fas fa-id-card",
            label: t("user_menu.personal_info", "Personīgā informācija"),
            hint: t("user_menu.personal_info_hint", "Vārds un uzvārds"),
          },
          {
            icon: "fas fa-user-gear",
            label: t("user_menu.settings", "Personīgie uzstādījumi"),
            hint: t(
              "user_menu.settings_hint",
              "Profils, valoda un datumu attēlojums",
            ),
          },
          {
            icon: "fas fa-bell",
            label: t("user_menu.notifications", "Paziņojumu uzstādījumi"),
            hint: t(
              "user_menu.notifications_hint",
              "Izvēlies, par ko saņemt brīdinājumus",
            ),
          },
          {
            icon: "fas fa-graduation-cap",
            label: t("user_menu.tour", "Sistēmas pamācība"),
            hint: t("user_menu.tour_hint", "Iziet ievadu vēlreiz"),
          },
        ],
      },
      {
        id: "finish",
        target: null,
        title: t("tour.finish.title", "Viss gatavs"),
        text: t(
          "tour.finish.text",
          "Sāc ar pirmo sarakstu. Ja gribēsi atkārtot pamācību, atradīsi to izvēlnē zem sava vārda.",
        ),
      },
    ],
    [t],
  );

  const allStepsRef = useRef(allSteps);
  allStepsRef.current = allSteps;

  /** Resolved once per run: steps whose anchor is missing are dropped. */
  const [steps, setSteps] = useState<TourStep[]>([]);

  const startTour = useCallback(() => {
    setSteps(allStepsRef.current);
    setActive(true);
  }, []);

  const persistCompleted = useCallback(() => {
    setDismissed(true);
    void setProductTourCompletedAction(true);
  }, []);

  const closeTour = useCallback(() => {
    setActive(false);
    persistCompleted();
  }, [persistCompleted]);

  useEffect(() => {
    if (dismissed || active) return;
    if (window.innerWidth < DESKTOP_MIN_WIDTH) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (findTarget("lists")) {
        window.clearInterval(timer);
        startTour();
        return;
      }
      if (attempts >= AUTOSTART_ATTEMPTS) {
        window.clearInterval(timer);
      }
    }, AUTOSTART_POLL_MS);

    return () => window.clearInterval(timer);
  }, [active, dismissed, startTour]);

  const value = useMemo(() => ({ startTour }), [startTour]);

  return (
    <ProductTourContext.Provider value={value}>
      {children}
      {active && steps.length > 0 ? (
        <ProductTourOverlay steps={steps} onClose={closeTour} />
      ) : null}
    </ProductTourContext.Provider>
  );
}

function ProductTourOverlay({
  steps,
  onClose,
}: {
  steps: TourStep[];
  onClose: () => void;
}) {
  const { t } = useTranslations();
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<TourLayout | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<TourLayout | null>(null);

  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  useEffect(() => {
    lockBodyOverflow();
    return () => unlockBodyOverflow();
  }, []);

  useEffect(() => {
    const element = findStepAnchor(step);
    if (!element) return;
    // Sidebar hover actions are opacity-0 until hovered; globals.css unhides this flag.
    element.dataset.tourSpotlight = "true";
    element.scrollIntoView({ block: "center", behavior: "smooth" });
    return () => {
      delete element.dataset.tourSpotlight;
    };
  }, [step]);

  useEffect(() => {
    let frame = 0;

    function tick() {
      const element = findStepAnchor(step);
      const next = measure(element, popoverRef.current?.offsetHeight ?? 200);
      const previous = layoutRef.current;
      if (!previous || !sameLayout(previous, next)) {
        layoutRef.current = next;
        setLayout(next);
      }
      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  const goNext = useCallback(() => {
    if (index >= steps.length - 1) {
      onClose();
      return;
    }
    setIndex(index + 1);
  }, [index, onClose, steps.length]);

  const goBack = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goBack();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, goNext, onClose]);

  if (typeof document === "undefined") return null;

  const rect = layout?.rect ?? null;
  const dimClassName = "fixed bg-zinc-900/40 backdrop-blur-[3px]";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("tour.aria.label", "Sistēmas pamācība")}
      className="fixed inset-0 z-[90]"
    >
      {rect ? (
        <>
          <div
            className={dimClassName}
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }}
          />
          <div
            className={dimClassName}
            style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className={dimClassName}
            style={{
              top: rect.top,
              left: 0,
              width: Math.max(0, rect.left),
              height: rect.height,
            }}
          />
          <div
            className={dimClassName}
            style={{
              top: rect.top,
              left: rect.left + rect.width,
              right: 0,
              height: rect.height,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed rounded-lg ring-2 ring-blue-500"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.25)",
            }}
          >
            <span className="absolute -top-2.5 -right-2.5 flex size-5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                {index + 1}
              </span>
            </span>
          </div>
        </>
      ) : (
        <div className={`${dimClassName} inset-0`} />
      )}

      <div
        ref={popoverRef}
        className="fixed flex max-h-[80vh] w-[320px] flex-col rounded-2xl bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.28)] ring-1 ring-zinc-200/80"
        style={{
          top: layout?.popoverTop ?? VIEWPORT_PADDING,
          left: layout?.popoverLeft ?? VIEWPORT_PADDING,
          opacity: layout ? 1 : 0,
        }}
      >
        <p className="text-[11px] font-medium tracking-wide text-blue-600 uppercase">
          {t("tour.step_counter", "{current} no {total}", {
            current: index + 1,
            total: steps.length,
          })}
        </p>
        <h2 className="mt-1 text-[15px] font-semibold text-zinc-900">{step.title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{step.text}</p>

        {step.options ? (
          <div className="mt-3 min-h-0 overflow-y-auto rounded-xl bg-zinc-50 p-3 [scrollbar-width:thin]">
            <p className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
              {t("tour.options_hint", "Zem šīs pogas:")}
            </p>
            <ul className="mt-2 space-y-2">
              {step.options.map((option) => (
                <li key={option.label} className="flex items-start gap-2.5">
                  <i
                    className={`${option.icon} mt-0.5 w-4 shrink-0 text-center text-[12px] text-zinc-500`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-zinc-900">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-zinc-500">
                      {option.hint}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 flex shrink-0 items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-medium text-zinc-400 transition hover:text-zinc-600"
          >
            {t("tour.actions.skip", "Izlaist")}
          </button>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex min-h-8 items-center rounded-lg px-3 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-100"
              >
                {t("tour.actions.back", "Atpakaļ")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-8 items-center rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white transition hover:bg-blue-700"
            >
              {isLast
                ? t("tour.actions.finish", "Pabeigt")
                : t("tour.actions.next", "Tālāk")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    getOverlayPortalRoot(),
  );
}
