"use client";

import { DashboardShell } from "../../_components/DashboardShell";
import { UploadProjectWizard } from "../_components/UploadProjectWizard";

export function NewListingClient() {
  return (
    <DashboardShell title="Upload Your Project">
      <UploadProjectWizard />
    </DashboardShell>
  );
}
