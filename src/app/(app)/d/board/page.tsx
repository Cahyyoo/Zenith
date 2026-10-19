import type { Metadata } from "next";

import { BoardContainer } from "@/features/developer/containers/board-container";

export const metadata: Metadata = { title: "Board" };

// A single static route for every project (`?project=<id>`), so the service
// worker can serve any board offline from one precached shell.
export default function BoardPage() {
  return <BoardContainer />;
}
