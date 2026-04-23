import { createFileRoute } from "@tanstack/react-router";
import BranchDashboardPage from "@/routes/branch-dashboard";

export const Route = createFileRoute("/admin-dashboard")({
  component: AdminDashboardPage,
  head: () => ({ meta: [{ title: "Admin dashboard - Simba Supermarket" }] }),
});

function AdminDashboardPage() {
  return <BranchDashboardPage />;
}
