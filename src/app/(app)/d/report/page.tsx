import type { Metadata } from "next";

import { ReportContainer } from "@/features/developer/containers/report-container";

export const metadata: Metadata = { title: "Report" };

export default function DeveloperReportPage() {
  return <ReportContainer />;
}
