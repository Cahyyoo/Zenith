export const routes = {
  personal: "/p",
  tags: "/p/tags",
  tasksWithTag: (tagId: string) => `/p?tag=${encodeURIComponent(tagId)}`,
  developer: "/d",
  projects: "/d/projects",
  board: (projectId: string, issueId?: string) => {
    const params = new URLSearchParams({ project: projectId });
    if (issueId) params.set("issue", issueId);
    return `/d/board?${params.toString()}`;
  },
  settings: "/settings",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const;
