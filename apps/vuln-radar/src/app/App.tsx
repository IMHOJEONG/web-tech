import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useState } from "react";
import { createAppQueryClient } from "./providers/query-client";
import { createAppRouter } from "./router/create-app-router";

export default function App() {
  const [queryClient] = useState(() => createAppQueryClient());
  const [router] = useState(() => createAppRouter({ queryClient }));

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
