import type { Metadata } from "next";

import { ProjectsContainer } from "@/features/developer/containers/projects-container";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <ProjectsContainer />;
}
