import { getTime } from '@web-tech/ui/lib/time'
import { cn } from '@web-tech/ui/lib/utils'

type DocumentDateTextProps = {
    date?: string
    className?: string
}

export function DocumentDateText({ date, className }: DocumentDateTextProps) {
    if (!date) {
        return null
    }

    return <span className={cn(className)}>{getTime(date)}</span>
}
