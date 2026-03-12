import { DashboardShell } from "../_components/DashboardShell";
import { DashboardWelcome } from "../_components/DashboardWelcome";

/**
 * Founder dashboard. Screen content lives in (founder)/_components.
 */
export default function FounderDashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <DashboardWelcome />
    </DashboardShell>
  );
}
