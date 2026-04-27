import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-dashboard")({
  component: AdminDashboardPage,
  head: () => ({ meta: [{ title: "Admin dashboard - Simba Supermarket" }] }),
});

function AdminDashboardPage() {
  return <Navigate to="/dashboard" />;
}
