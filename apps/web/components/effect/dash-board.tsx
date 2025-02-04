"use client";
import { useState, useMemo, useCallback } from "react";

import { Effect } from "effect";

export default function DashBoard() {
  const [count, setCount] = useState(0);

  const task = useMemo(
    () => Effect.sync(() => setCount((current) => current + 1)),
    [setCount],
  );

  const increment = useCallback(() => Effect.runSync(task), [task]);

  return <button onClick={increment}>count is {count}</button>;
}
