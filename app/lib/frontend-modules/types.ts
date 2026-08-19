export type FrontendModuleSummary = {
  id: string;
  moduleKey: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type FrontendModuleInput = {
  moduleKey: string;
};
