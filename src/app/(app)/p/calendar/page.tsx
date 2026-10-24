import type { Metadata } from "next";

import { CalendarContainer } from "@/features/personal/containers/calendar-container";

export const metadata: Metadata = { title: "Calendar" };

export default function PersonalCalendarPage() {
  return <CalendarContainer />;
}
