import { createCspReportCollector } from "@web-tech/api/csp-reporting";

export default {
  fetch: createCspReportCollector({
    app: "vuln-radar",
    emit: (summary) => console.info("[csp-report]", summary),
  }),
};
