import type { Metadata } from "next";

import { FocusContainer } from "@/features/developer/containers/focus-container";

export const metadata: Metadata = { title: "Focus" };

export default function FocusPage() {
  return <FocusContainer />;
}
