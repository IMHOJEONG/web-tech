export function getDocumentCalendarDate(value?: string) {
    if (!value || !Number.isFinite(Date.parse(value))) return undefined
    const calendarDate = value.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) return undefined
    const parsed = new Date(`${calendarDate}T00:00:00Z`)
    return Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === calendarDate
        ? calendarDate
        : undefined
}
