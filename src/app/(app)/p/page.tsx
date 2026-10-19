import type { Metadata } from "next";

import { TaskListContainer } from "@/features/personal/containers/task-list-container";

export const metadata: Metadata = { title: "Tasks" };

export default function PersonalTasksPage() {
  return <TaskListContainer />;
}
