import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useState } from "react";
import { createAppQueryClient } from "./providers/query-client";
import { createAppRouter } from "./router/create-app-router";
import { I18nProvider } from "@/shared/i18n/i18n-provider";

export default function App() {
  const [queryClient] = useState(() => createAppQueryClient());
  const [router] = useState(() => createAppRouter({ queryClient }));

  return (
    <I18nProvider locale="ko">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nProvider>
  );
}
