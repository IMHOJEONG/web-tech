export function getDocumentCalendarDate(value?: string) {
    if (!value || !Number.isFinite(Date.parse(value))) return undefined
    let calendarDate = value.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
        const parsed = new Date(value)
        // ISO date-only values are UTC; prose dates use local calendar parts.
        if (/^\d{4}(?:-\d{2})?$/.test(value)) {
            calendarDate = parsed.toISOString().slice(0, 10)
        } else {
            calendarDate = [
                String(parsed.getFullYear()).padStart(4, '0'),
                String(parsed.getMonth() + 1).padStart(2, '0'),
                String(parsed.getDate()).padStart(2, '0'),
            ].join('-')
        }
    }
    const parsed = new Date(`${calendarDate}T00:00:00Z`)
    return Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === calendarDate
        ? calendarDate
        : undefined
}
