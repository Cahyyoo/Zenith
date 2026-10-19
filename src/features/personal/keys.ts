export const personalKeys = {
  all: ["personal"] as const,
  tasks: () => [...personalKeys.all, "tasks"] as const,
  tags: () => [...personalKeys.all, "tags"] as const,
};
