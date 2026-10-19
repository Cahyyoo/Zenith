import type { Metadata } from "next";

import { TagManagerContainer } from "@/features/personal/containers/tag-manager-container";

export const metadata: Metadata = { title: "Tags" };

export default function TagsPage() {
  return <TagManagerContainer />;
}
