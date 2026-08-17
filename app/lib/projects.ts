export type ProjectStatus = "active" | "archived";

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
};

export const PROJECTS_STORAGE_KEY = "routine-app-projects";
export const PROJECTS_CHANGE_EVENT = "routine-app-projects-change";

export function createProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `project-${crypto.randomUUID()}`;
  }
  return `project-${Date.now()}`;
}

export function createDefaultProjects(): Project[] {
  return [
    {
      id: "project-website",
      name: "Mājas lapa",
      description: "Publiskās vietnes saturs un palaišana.",
      status: "active",
    },
    {
      id: "project-onboarding",
      name: "Klienta onboarding",
      description: "Jauno klientu pieņemšanas soļi.",
      status: "active",
    },
    {
      id: "project-docs",
      name: "Iekšējā dokumentācija",
      description: "Komandas darba kārtības apraksts.",
      status: "active",
    },
  ];
}

export function normalizeStoredProjects(value: unknown): Project[] | null {
  if (!Array.isArray(value)) return null;

  const projects = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("name" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const name = String(item.name).trim();
      const description =
        "description" in item && typeof item.description === "string"
          ? item.description
          : "";
      const status =
        "status" in item && item.status === "archived" ? "archived" : "active";

      if (!id || !name) return null;
      return { id, name, description, status };
    })
    .filter((item): item is Project => item !== null);

  return projects;
}

export function getActiveProjects(projects: Project[]): Project[] {
  return projects.filter((project) => project.status === "active");
}
