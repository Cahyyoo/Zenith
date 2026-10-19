export const developerKeys = {
  all: ["developer"] as const,
  projects: () => [...developerKeys.all, "projects"] as const,
  issues: (projectId: string) => [...developerKeys.all, "issues", projectId] as const,
};
