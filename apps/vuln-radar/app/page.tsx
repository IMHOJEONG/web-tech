export default function Home() {
  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Global Vuln Radar</p>
        <h1>Frontend reset complete.</h1>
        <p className="body">
          Legacy monitoring UI, local proxy routes, images, and experimental
          auth code were removed. This app is now a clean base for the new
          frontend.
        </p>
        <div className="list">
          <div>Frontend entry is active.</div>
          <div>Backend health should be checked via `/api/backend/health`.</div>
          <div>Next step is building the new Vite-oriented UI structure.</div>
        </div>
      </section>
    </main>
  );
}
