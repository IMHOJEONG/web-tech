import { getTime } from '@web-tech/ui/lib/time'
import { cn } from '@web-tech/ui/lib/utils'
import { getDocumentCalendarDate } from '../lib/document-date'

type DocumentDateTextProps = {
    date?: string
    className?: string
}

export function DocumentDateText({ date, className }: DocumentDateTextProps) {
    const calendarDate = getDocumentCalendarDate(date)
    if (!calendarDate) {
        return null
    }

    return <span className={cn(className)}>{getTime(calendarDate)}</span>
}
