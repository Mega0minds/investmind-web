"use client";

import { DashboardShell } from "../../_components/DashboardShell";
import { UploadProjectWizard } from "../_components/UploadProjectWizard";

export default function NewListing() {
  return (
    <DashboardShell title="Upload Your Project">
      <UploadProjectWizard />
    </DashboardShell>
  );
}
