import { createCspReportCollector } from '@web-tech/api/csp-reporting'

export const runtime = 'nodejs'

export const POST = createCspReportCollector({
    app: 'docs',
    emit: (summary) => console.info('[csp-report]', summary),
})
