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
import {
  PROJECTS_CHANGE_EVENT,
  PROJECTS_STORAGE_KEY,
  createProjectId,
  normalizeStoredProjects,
  type Project,
} from "@/app/lib/projects";

type ProjectsContextValue = {
  isReady: boolean;
  projects: Project[];
  addProject: (input: { name: string; description: string }) => Project;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

function persistProjects(projects: Project[]) {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  window.dispatchEvent(new Event(PROJECTS_CHANGE_EVENT));
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const loadedFromStorage = useRef(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loadedFromStorage.current) return;
    loadedFromStorage.current = true;

    try {
      const storedValue = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
      const storedProjects = storedValue
        ? normalizeStoredProjects(JSON.parse(storedValue))
        : null;
      setProjects(storedProjects ?? []);
    } catch {
      setProjects([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    persistProjects(projects);
  }, [isReady, projects]);

  const addProject = useCallback((input: { name: string; description: string }) => {
    const project: Project = {
      id: createProjectId(),
      name: input.name.trim(),
      description: input.description.trim(),
      status: "active",
    };

    setProjects((current) => [...current, project]);
    return project;
  }, []);

  const value = useMemo(
    () => ({ isReady, projects, addProject }),
    [addProject, isReady, projects],
  );

  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider");
  }
  return context;
}
