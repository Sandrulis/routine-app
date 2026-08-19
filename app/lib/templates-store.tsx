"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import {
  deleteTemplateRow,
  fetchTeamTemplates,
  insertTemplate,
  replaceTemplateItems,
  updateTemplateRow,
} from "@/app/lib/db/work-data";
import { useTeam } from "@/app/lib/team-store";
import {
  createTemplateId,
  sanitizeTemplateItems,
  type WorkTemplate,
  type WorkTemplateItem,
} from "@/app/lib/templates";

type TemplatesContextValue = {
  templates: WorkTemplate[];
  items: WorkTemplateItem[];
  isReady: boolean;
  addTemplate: (input: { name: string; description: string }) => WorkTemplate;
  saveTemplate: (input: {
    templateId: string;
    name: string;
    description: string;
    items: WorkTemplateItem[];
  }) => void;
  deleteTemplate: (templateId: string) => void;
  templateItems: (templateId: string) => WorkTemplateItem[];
};

const TemplatesContext = createContext<TemplatesContextValue | null>(null);

export function TemplatesProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isReady: authReady } = useAuthSession();
  const { isReady: teamReady, currentTeam } = useTeam();
  const userId = authUser?.id ?? null;
  const teamId = currentTeam?.id ?? null;
  const canLoad = authReady && teamReady;
  const [templates, setTemplates] = useState<WorkTemplate[]>([]);
  const [items, setItems] = useState<WorkTemplateItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canLoad) return;
    setIsReady(false);

    if (!userId || !teamId) {
      setTemplates([]);
      setItems([]);
      setIsReady(true);
      return;
    }

    let cancelled = false;
    void fetchTeamTemplates(teamId)
      .then((workspace) => {
        if (cancelled) return;
        setTemplates(workspace.templates);
        setItems(workspace.items);
        setIsReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load templates", error);
        setTemplates([]);
        setItems([]);
        setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [canLoad, teamId, userId]);

  const addTemplate = useCallback(
    (input: { name: string; description: string }) => {
      const createdAt = new Date().toISOString();
      const template: WorkTemplate = {
        id: createTemplateId(),
        teamId: teamId ?? "",
        name: input.name.trim(),
        description: input.description.trim(),
        sortOrder: templates.reduce(
          (max, item) => Math.max(max, item.sortOrder),
          -1,
        ) + 1,
        createdAt,
      };
      setTemplates((current) => [...current, template]);
      if (teamId) {
        void insertTemplate(template).catch((error) => {
          console.error("Failed to save template", error);
        });
      }
      return template;
    },
    [teamId, templates],
  );

  const saveTemplate = useCallback(
    (input: {
      templateId: string;
      name: string;
      description: string;
      items: WorkTemplateItem[];
    }) => {
      const name = input.name.trim();
      const description = input.description.trim();
      const nextItems = sanitizeTemplateItems(input.templateId, input.items);
      setTemplates((current) =>
        current.map((template) =>
          template.id === input.templateId
            ? { ...template, name, description }
            : template,
        ),
      );
      setItems((current) => [
        ...current.filter((item) => item.templateId !== input.templateId),
        ...nextItems,
      ]);
      void updateTemplateRow(input.templateId, { name, description })
        .then(() => replaceTemplateItems(input.templateId, nextItems))
        .catch((error) => {
          console.error("Failed to save template", error);
        });
    },
    [],
  );

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates((current) => current.filter((item) => item.id !== templateId));
    setItems((current) => current.filter((item) => item.templateId !== templateId));
    void deleteTemplateRow(templateId).catch((error) => {
      console.error("Failed to delete template", error);
    });
  }, []);

  const value = useMemo<TemplatesContextValue>(
    () => ({
      templates,
      items,
      isReady,
      addTemplate,
      saveTemplate,
      deleteTemplate,
      templateItems: (templateId: string) =>
        items.filter((item) => item.templateId === templateId),
    }),
    [addTemplate, deleteTemplate, isReady, items, saveTemplate, templates],
  );

  return (
    <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplatesContext);
  if (!context) {
    throw new Error("useTemplates must be used within TemplatesProvider");
  }
  return context;
}
