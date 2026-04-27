import { createRouter } from "@tanstack/react-router";
import { RouterErrorBoundary } from "@/components/RouterErrorBoundary";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  context: {},
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: RouterErrorBoundary,
});
