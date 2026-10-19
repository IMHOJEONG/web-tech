import type { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AppSidebar } from "@/app/ui/app-sidebar";
import { FeedPage } from "@/pages/feed/ui/feed-page";
import { OverviewPage } from "@/pages/overview/ui/overview-page";
import { VulnerabilityDetailPage } from "@/pages/vulnerability-detail/ui/vulnerability-detail-page";
import { runtimeConfig } from "@/shared/config/runtime";

export interface AppRouterContext {
  queryClient: QueryClient;
}

function RootLayout() {
  return (
    <div className="grid min-h-screen md:grid-cols-[72px_minmax(0,1fr)]">
      <AppSidebar />
      <main
        className="min-w-0 px-4 py-5 md:px-6 md:py-6"
        aria-label={runtimeConfig.appTitle}
      >
        <Outlet />
      </main>
    </div>
  );
}

const rootRoute = createRootRouteWithContext<AppRouterContext>()({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: runtimeConfig.defaultRoute });
  },
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/overview",
  component: OverviewPage,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed",
  component: FeedPage,
});

const vulnerabilityDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vulnerabilities/$cveId",
  component: VulnerabilityDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  overviewRoute,
  feedRoute,
  vulnerabilityDetailRoute,
]);

export function createAppRouter(context: AppRouterContext) {
  return createRouter({
    routeTree,
    context,
    defaultPreload: "intent",
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
