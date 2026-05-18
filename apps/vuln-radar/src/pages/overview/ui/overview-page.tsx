import { runtimeConfig } from "@/shared/config/runtime";

export function OverviewPage() {
  return (
    <section className="page-grid">
      <article className="hero-panel">
        <p className="app-eyebrow">Bootstrap Ready</p>
        <h2>Vite entry, Router, Query provider are now the default shell.</h2>
        <p className="hero-copy">
          This reset keeps the frontend as a focused CSR dashboard. We expose a
          stable browser API path, leave backend origin handling to the Vite
          proxy, and keep runtime config in one place before feature work
          starts.
        </p>
        <p className="config-line">
          Public API base path
          <code>{runtimeConfig.apiBasePath}</code>
        </p>

        <div className="status-grid">
          <div className="status-card">
            <strong>App entry</strong>
            <span>
              <code>src/app/main.tsx</code> mounts the Vite root and global
              styles.
            </span>
          </div>
          <div className="status-card">
            <strong>Providers</strong>
            <span>
              <code>QueryClientProvider</code> and <code>RouterProvider</code>
              are wired in <code>src/app/App.tsx</code>.
            </span>
          </div>
          <div className="status-card">
            <strong>Config</strong>
            <span>
              Client-safe env parsing lives in <code>src/shared/config</code>.
            </span>
          </div>
        </div>
      </article>

      <div className="section-grid">
        <article className="section-panel">
          <h3>Transition scope</h3>
          <ul>
            <li>Next App Router and Next runtime files are removed.</li>
            <li>
              Public browser calls stay fixed at <code>/api/backend/*</code>.
            </li>
            <li>
              Backend origin is a dev-server concern via{" "}
              <code>VULN_RADAR_BACKEND_ORIGIN</code>.
            </li>
          </ul>
        </article>

        <article className="section-panel">
          <h3>Immediate next slice</h3>
          <ul>
            <li>
              Create the first entity adapters under <code>src/entities</code>.
            </li>
            <li>Attach health-check queries with the shared API client.</li>
            <li>Expand routes for feed, watchlist, alerts, and settings.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
