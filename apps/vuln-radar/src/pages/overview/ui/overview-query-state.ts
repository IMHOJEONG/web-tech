export interface OverviewQuerySnapshot<T> {
  data: T | undefined;
  error: unknown;
  isFetching: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt?: number;
}

export function getOverviewQueryState<T>(query: OverviewQuerySnapshot<T>) {
  if (query.data !== undefined) return query.error ? "stale" : "ready";
  if (query.error || query.errorUpdatedAt) return "unavailable";
  return "pending";
}

export function isOverviewUnavailable(
  queries: readonly OverviewQuerySnapshot<unknown>[],
) {
  return (
    queries.length > 0 &&
    queries.every(
      (query) =>
        getOverviewQueryState(query) === "unavailable" &&
        Boolean(query.error) &&
        !query.isFetching,
    )
  );
}
