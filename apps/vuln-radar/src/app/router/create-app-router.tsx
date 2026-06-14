import type { QueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { OverviewPage } from "@/pages/overview/ui/overview-page";
import { VulnerabilityDetailPage } from "@/pages/vulnerability-detail/ui/vulnerability-detail-page";
import { runtimeConfig } from "@/shared/config/runtime";
import { useI18n } from "@/shared/i18n/i18n-provider";

export interface AppRouterContext {
  queryClient: QueryClient;
}

function RootLayout() {
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">{t("app.eyebrow")}</p>
          <h1>{runtimeConfig.appTitle}</h1>
        </div>
        <nav className="app-nav">
          <Link
            to="/overview"
            className="app-nav-link"
            activeProps={{ "data-active": "true" }}
          >
            {t("nav.overview")}
          </Link>
        </nav>
      </header>

      <main className="app-main">
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

const vulnerabilityDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vulnerabilities/$cveId",
  component: VulnerabilityDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  overviewRoute,
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
