import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/branch-dashboard")({
  component: BranchDashboardPage,
  head: () => ({ meta: [{ title: "Branch dashboard - Simba Supermarket" }] }),
});

export default function BranchDashboardPage() {
  return <Navigate to="/dashboard" />;
}
