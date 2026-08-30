interface FeedSummaryStripProps {
  stats: {
    total: number;
    p0: number;
    kev: number;
    watchlistMatches: number;
  };
  labels: {
    total: string;
    p0: string;
    kev: string;
    watchlistMatches: string;
  };
}

export function FeedSummaryStrip({ labels, stats }: FeedSummaryStripProps) {
  const items = [
    { label: labels.total, value: stats.total },
    { label: labels.p0, value: stats.p0 },
    { label: labels.kev, value: stats.kev },
    { label: labels.watchlistMatches, value: stats.watchlistMatches },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-sm border border-radar-border/65 bg-radar-panel-muted px-4 py-4"
        >
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-radar-copy/58">
            {item.label}
          </p>
          <strong className="mt-2 block font-mono text-2xl text-white">
            {item.value.toLocaleString("en-US")}
          </strong>
        </article>
      ))}
    </section>
  );
}
